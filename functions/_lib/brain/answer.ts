// The brain: every channel (margin chat, /ask, Telegram) calls answer().
// retrieve → generate → brand post-check (one rewrite if needed) → log.

import { db, toVector, type DbEnv } from '../db.ts';
import { chat, embed, type ChatMessage, type ChatResult, type OpenRouterEnv } from '../openrouter.ts';
import {
  CHAT_MODELS,
  CONTACT,
  EMBED_MODEL,
  MAX_CHUNKS_PER_DOC,
  MAX_TOKENS,
  SIMILARITY_THRESHOLD,
  TEMPERATURE,
  TOP_K,
} from './config.ts';
import { allowedNumbers, checkReply, toPlainText, type ProofItem } from './guardrail.ts';

export type BrainEnv = DbEnv & OpenRouterEnv;
export type Channel = 'web' | 'ask' | 'telegram';
export type Turn = { role: 'user' | 'assistant'; content: string };

type Retrieved = { id: number; document_id: string; title: string; content: string; metadata: Record<string, unknown>; similarity: number };

export type Answer = {
  reply: string;
  sources: { title: string; project?: string }[];
  guardrailFlags: string[];
  // Resolves once the turn is stored; channels hand it to waitUntil so logging never delays the reply
  logged: Promise<void>;
};

const FALLBACK_REPLY = `I can't answer that well. Samira can tell you directly: ${CONTACT.email}.`;

async function retrieve(env: BrainEnv, turns: Turn[]): Promise<Retrieved[]> {
  // Include the previous question so follow-ups like "and how fast was it?" still find the project
  const userTurns = turns.filter((t) => t.role === 'user').slice(-2);
  const query = userTurns.map((t) => t.content).join('\n');
  const [embedding] = await embed(env, EMBED_MODEL, [query]);
  const candidates = await db(env).rpc<Retrieved[]>('match_chunks', {
    query_embedding: toVector(embedding),
    match_count: TOP_K * 3,
    similarity_threshold: SIMILARITY_THRESHOLD,
  });
  return diversify(candidates);
}

// Short FAQ chunks match almost everything; capping chunks per document leaves room for the project docs
export function diversify<T extends { document_id?: string; title: string }>(ranked: T[], limit = TOP_K, perDoc = MAX_CHUNKS_PER_DOC) {
  const taken = new Map<string, number>();
  const out: T[] = [];
  for (const c of ranked) {
    const key = c.document_id ?? c.title;
    if ((taken.get(key) ?? 0) >= perDoc) continue;
    taken.set(key, (taken.get(key) ?? 0) + 1);
    out.push(c);
    if (out.length === limit) break;
  }
  return out;
}

function buildSystem(prompt: string, proofs: (ProofItem & { how_measured: string })[], chunks: Retrieved[]) {
  const results = proofs
    .map(
      (p) =>
        `- ${p.value} ${p.label} — ${p.project}${p.team_credit ? ` (team result: ${p.team_credit})` : ''}` +
        `. How it was measured, word for word — add nothing to it: "${p.how_measured}"`
    )
    .join('\n');
  const context = chunks.length
    ? chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')
    : '(No document matched this question. Say you do not know and offer Samira\'s email.)';
  return `${prompt.trim()}

Approved results — the only numbers you may use, always with the project name:
${results}

Context:
${context}`;
}

async function generate(env: BrainEnv, system: string, turns: Turn[], extra: ChatMessage[] = []) {
  const result = await chat(env, {
    models: CHAT_MODELS,
    messages: [{ role: 'system', content: system }, ...turns, ...extra],
    maxTokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  });
  return { ...result, content: toPlainText(result.content) };
}

export async function answer(
  env: BrainEnv,
  opts: { channel: Channel; conversationId: string; externalUserId?: string; turns: Turn[] }
): Promise<Answer> {
  const supabase = db(env);
  const [prompts, proofs, chunks] = await Promise.all([
    supabase.select<{ content: string }>('prompt_versions', 'select=content&persona=eq.default&is_active=is.true&limit=1'),
    supabase.select<ProofItem & { how_measured: string }>(
      'proof_items',
      'select=value,label,project,team_credit,how_measured&is_active=is.true&order=id'
    ),
    retrieve(env, opts.turns),
  ]);
  if (!prompts.length) throw new Error('no active system prompt in prompt_versions');

  const system = buildSystem(prompts[0].content, proofs, chunks);
  const allowed = allowedNumbers(proofs, chunks.map((c) => c.content).join('\n'));

  const check = (r: ChatResult) =>
    !r.content ? ['empty_reply'] : r.finishReason === 'length' ? ['truncated'] : checkReply(r.content, allowed);

  let result = await generate(env, system, opts.turns);
  // A cut-off reply is retried as-is first; asking the model to "fix" half a sentence goes badly
  if (result.finishReason === 'length' || !result.content) result = await generate(env, system, opts.turns);
  let flags = check(result);
  const guardrailFlags = [...flags];

  // One rewrite with the exact problems named; if it still breaks a rule, send a safe fallback
  if (flags.length) {
    const draft = result.content;
    result = await generate(env, system, opts.turns, [
      { role: 'assistant', content: draft || '(empty)' },
      {
        role: 'user',
        content:
          `Rewrite your last reply. It broke these rules: ${flags.join(', ')}. ` +
          'Use only approved numbers, always with the project name. Avoid the banned words and the word "senior". ' +
          'Reply with the corrected text only.',
      },
    ]);
    flags = check(result);
    guardrailFlags.push('rewritten', ...flags);
    if (flags.length) {
      result = { ...result, content: FALLBACK_REPLY };
      guardrailFlags.push('fallback');
    }
  }

  const reply = result.content;
  const logged = logTurn(env, opts, reply, {
    model_used: result.model,
    tokens_in: result.tokensIn,
    tokens_out: result.tokensOut,
    cost_usd: result.costUsd,
    retrieved_chunk_ids: chunks.map((c) => c.id),
    guardrail_flags: [...new Set(guardrailFlags)],
  });

  const seen = new Set<string>();
  const sources = chunks
    .filter((c) => !seen.has(c.title) && seen.add(c.title))
    .map((c) => ({ title: c.title, project: c.metadata.project as string | undefined }));

  return { reply, sources, guardrailFlags: [...new Set(guardrailFlags)], logged };
}

async function logTurn(
  env: BrainEnv,
  opts: { channel: Channel; conversationId: string; externalUserId?: string; turns: Turn[] },
  reply: string,
  meta: Record<string, unknown>
) {
  const supabase = db(env);
  try {
    await supabase.insert(
      'conversations',
      { id: opts.conversationId, channel: opts.channel, external_user_id: opts.externalUserId ?? null },
      { ignoreDuplicates: true }
    );
    const question = opts.turns[opts.turns.length - 1].content;
    // PostgREST bulk inserts need identical keys on every row
    const userMeta = {
      model_used: null,
      tokens_in: null,
      tokens_out: null,
      cost_usd: null,
      retrieved_chunk_ids: [],
      guardrail_flags: [],
    };
    await supabase.insert('messages', [
      { conversation_id: opts.conversationId, role: 'user', content: question, ...userMeta },
      { conversation_id: opts.conversationId, role: 'assistant', content: reply, ...userMeta, ...meta },
    ]);
  } catch (error) {
    // Logging must never break the chat
    console.error('chat log failed:', error);
  }
}
