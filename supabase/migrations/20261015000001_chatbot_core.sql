-- Chatbot core schema (MVP): knowledge base, proof bank, conversations, leads, prompt versions.
-- Every table has RLS on and no policies: only server code using the secret key can read or write.

create extension if not exists vector with schema extensions;

-- Replaced by conversations + messages (was empty when dropped)
drop table if exists chat_messages;

create or replace function set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────── Knowledge base ─────────────

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null check (source_type in ('pdf', 'docx', 'markdown', 'text', 'url', 'manual')),
  source_url text,
  -- Only 'public' documents are embedded and retrievable
  visibility text not null default 'internal' check (visibility in ('public', 'internal')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- nvidia/nemotron-3-embed-1b returns 2048 dims; halfvec allows an HNSW index above vector's 2000-dim limit.
-- Changing the embedding model means changing this column and re-embedding every chunk.
create table chunks (
  id bigint generated always as identity primary key,
  document_id uuid not null references documents (id) on delete cascade,
  content text not null,
  embedding extensions.halfvec(2048),
  token_count int,
  chunk_index int not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index chunks_embedding_idx on chunks
  using hnsw (embedding extensions.halfvec_cosine_ops);

-- Retrieval: top-k public chunks above a cosine-similarity threshold
create or replace function match_chunks(
  query_embedding extensions.halfvec(2048),
  match_count int default 5,
  similarity_threshold float default 0.3
)
returns table (id bigint, document_id uuid, title text, content text, metadata jsonb, similarity float)
language sql stable set search_path = '' as $$
  select c.id, c.document_id, d.title, c.content, c.metadata,
         1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.chunks c
  join public.documents d on d.id = c.document_id
  where d.visibility = 'public'
    and d.status = 'ready'
    and c.embedding is not null
    and 1 - (c.embedding operator(extensions.<=>) query_embedding) >= similarity_threshold
  order by c.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$$;

-- ───────────── Proof bank: the only source of numbers ─────────────

create table proof_items (
  id bigint generated always as identity primary key,
  value text not null,
  label text not null,
  project text not null,
  team_credit text,
  how_measured text,
  is_active boolean not null default false,
  updated_at timestamptz not null default now(),
  -- Brand guide 08, rule 3: a number nobody can explain is never used
  constraint active_needs_how_measured
    check (not is_active or coalesce(trim(how_measured), '') <> '')
);

create trigger proof_items_updated_at before update on proof_items
  for each row execute function set_updated_at();

-- ───────────── Conversations ─────────────

create table conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('web', 'ask', 'telegram')),
  external_user_id text,
  status text not null default 'active' check (status in ('active', 'handoff', 'closed')),
  summary text,
  started_at timestamptz not null default now()
);

create table messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  model_used text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10, 6),
  retrieved_chunk_ids bigint[] not null default '{}',
  guardrail_flags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at);

-- ───────────── Leads (screen requests) ─────────────
-- role / want_built / found_via are fixed lists + 'other' so they can be counted on the dashboard

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  role text not null check (role in
    ('founder', 'product_lead', 'engineering_manager', 'developer', 'designer', 'operations', 'recruiter', 'other')),
  role_other text,
  want_built text not null check (want_built in
    ('admin_panel', 'dashboard', 'internal_tool', 'data_heavy_web_app', 'website', 'other')),
  want_built_other text,
  screen_description text,
  screenshot_path text,
  found_via text not null check (found_via in
    ('linkedin', 'x', 'referral', 'search', 'community', 'recruiter', 'other')),
  found_via_other text,
  source_channel text not null check (source_channel in ('web', 'ask', 'telegram')),
  conversation_id uuid references conversations (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'audit_sent', 'call', 'won', 'lost')),
  created_at timestamptz not null default now(),
  constraint role_other_given check (role <> 'other' or coalesce(trim(role_other), '') <> ''),
  constraint want_built_other_given check (want_built <> 'other' or coalesce(trim(want_built_other), '') <> ''),
  constraint found_via_other_given check (found_via <> 'other' or coalesce(trim(found_via_other), '') <> ''),
  constraint screen_given check (screen_description is not null or screenshot_path is not null)
);

-- ───────────── System prompt versions ─────────────

create table prompt_versions (
  id bigint generated always as identity primary key,
  content text not null,
  persona text not null default 'default',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  created_by text
);

-- At most one active prompt per persona
create unique index prompt_versions_one_active on prompt_versions (persona) where is_active;

-- ───────────── Lock everything down ─────────────

alter table documents enable row level security;
alter table chunks enable row level security;
alter table proof_items enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table leads enable row level security;
alter table prompt_versions enable row level security;

revoke execute on function match_chunks from public, anon, authenticated;
