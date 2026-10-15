// Loads kb/*.md into Supabase: one documents row per file, embedded chunks for public files.
// Re-running replaces what changed: a file's old document and chunks are deleted first.
//
//   npm run kb:ingest

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { db, toVector } from '../functions/_lib/db.ts';
import { embed } from '../functions/_lib/openrouter.ts';
import { chunkSections, chunkText } from '../functions/_lib/brain/chunk.ts';
import { EMBED_MODEL } from '../functions/_lib/brain/config.ts';

const ROOT = join(import.meta.dirname, '..');
const KB_DIR = join(ROOT, 'kb');

function loadEnv() {
  const env: Record<string, string> = {};
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENROUTER_API_KEY']) {
    if (!env[key]) throw new Error(`${key} is missing from .env`);
  }
  return env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string; OPENROUTER_API_KEY: string };
}

// Frontmatter subset used in kb/: `key: value` and `key: [a, b]`.
// `split: sections` makes one chunk per "## " heading instead of size-based chunks.
function parse(file: string) {
  const raw = readFileSync(join(KB_DIR, file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta: Record<string, string | string[]> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const value = kv[2].trim();
    meta[kv[1]] = value.startsWith('[') ? value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean) : value;
  }
  if (!meta.title) throw new Error(`${file}: missing title`);
  if (meta.visibility !== 'public' && meta.visibility !== 'internal') {
    throw new Error(`${file}: visibility must be public or internal`);
  }
  return { meta, body: m[2].trim() };
}

async function main() {
  const env = loadEnv();
  const supabase = db(env);
  const files = readdirSync(KB_DIR).filter((f) => f.endsWith('.md')).sort();

  // Documents whose kb file was deleted go too
  const existing = await supabase.select<{ id: string; source_url: string }>('documents', 'select=id,source_url&source_url=like.kb/*');
  for (const doc of existing) {
    if (!files.includes(doc.source_url.slice(3))) {
      await supabase.remove('documents', `id=eq.${doc.id}`);
      console.log(`removed  ${doc.source_url}`);
    }
  }

  for (const file of files) {
    const { meta, body } = parse(file);
    const sourceUrl = `kb/${file}`;
    const title = meta.title as string;
    const tags = (meta.tags as string[]) ?? [];
    const { title: _t, visibility, tags: _tags, split, ...docMeta } = meta;

    await supabase.remove('documents', `source_url=eq.${encodeURIComponent(sourceUrl)}`);
    const [doc] = await supabase.insert<{ id: string }>('documents', {
      title,
      source_type: 'markdown',
      source_url: sourceUrl,
      visibility,
      status: visibility === 'public' ? 'processing' : 'ready',
      tags,
    });

    if (visibility !== 'public') {
      console.log(`stored   ${file} (internal, not embedded)`);
      continue;
    }

    try {
      const chunks = split === 'sections' ? chunkSections(title, body) : chunkText(title, body);
      const embeddings = await embed(env, EMBED_MODEL, chunks.map((c) => c.content));
      await supabase.insert(
        'chunks',
        chunks.map((c, i) => ({
          document_id: doc.id,
          content: c.content,
          embedding: toVector(embeddings[i]),
          token_count: c.tokenCount,
          chunk_index: c.index,
          metadata: { ...docMeta, title, file },
        }))
      );
      await supabase.update('documents', `id=eq.${doc.id}`, { status: 'ready' });
      console.log(`embedded ${file} → ${chunks.length} chunk(s)`);
    } catch (error) {
      await supabase.update('documents', `id=eq.${doc.id}`, { status: 'error' });
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
