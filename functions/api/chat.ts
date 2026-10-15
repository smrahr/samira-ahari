// Web channel: the margin chat. Validates the request, asks the brain, logs in the background.

import { answer, type BrainEnv, type Turn } from '../_lib/brain/answer.ts';
import { OpenRouterError } from '../_lib/openrouter.ts';

const MAX_TURNS = 20;
const MAX_CHARS = 600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const isValidTurns = (turns: unknown): turns is Turn[] =>
  Array.isArray(turns) &&
  turns.length > 0 &&
  turns.length <= MAX_TURNS &&
  turns[0].role === 'user' &&
  turns[turns.length - 1].role === 'user' &&
  turns.every(
    (t) =>
      (t?.role === 'user' || t?.role === 'assistant') &&
      typeof t.content === 'string' &&
      t.content.trim() &&
      t.content.length <= MAX_CHARS
  );

export async function onRequestPost({
  request,
  env,
  waitUntil,
}: {
  request: Request;
  env: Partial<BrainEnv>;
  waitUntil: (promise: Promise<unknown>) => void;
}) {
  if (!env.OPENROUTER_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return json({ error: 'not_configured' }, 503);
  }

  let body: { messages?: unknown; conversationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const { messages, conversationId } = body;
  if (!isValidTurns(messages)) return json({ error: 'bad_request' }, 400);
  const id = typeof conversationId === 'string' && UUID.test(conversationId) ? conversationId : crypto.randomUUID();

  try {
    const result = await answer(env as BrainEnv, {
      channel: 'web',
      conversationId: id,
      turns: messages.map(({ role, content }) => ({ role, content })),
    });
    waitUntil(result.logged);
    return json({ reply: result.reply, conversationId: id, sources: result.sources });
  } catch (error) {
    console.error('chat failed:', error);
    if (error instanceof OpenRouterError && error.status === 429) return json({ error: 'busy' }, 429);
    return json({ error: 'upstream' }, 502);
  }
}
