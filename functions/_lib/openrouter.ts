// OpenRouter: one key and one OpenAI-compatible API for chat and embeddings.

export type OpenRouterEnv = { OPENROUTER_API_KEY: string };

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatResult = {
  content: string;
  // 'length' means the model ran out of tokens mid-reply
  finishReason: string | null;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
  costUsd: number | null;
};

const BASE = 'https://openrouter.ai/api/v1';

export class OpenRouterError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`openrouter ${status}: ${body}`);
    this.status = status;
  }
}

async function post<T>(env: OpenRouterEnv, path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new OpenRouterError(res.status, await res.text());
  const data = await res.json();
  // OpenRouter can answer 200 with an error object when every fallback model failed
  if (data?.error) throw new OpenRouterError(data.error.code ?? 502, JSON.stringify(data.error));
  return data as T;
}

export async function chat(
  env: OpenRouterEnv,
  opts: { models: string[]; messages: ChatMessage[]; maxTokens: number; temperature: number }
): Promise<ChatResult> {
  const data = await post<any>(env, 'chat/completions', {
    models: opts.models,
    messages: opts.messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    usage: { include: true },
  });
  const choice = data.choices?.[0];
  return {
    content: (choice?.message?.content ?? '').trim(),
    finishReason: choice?.finish_reason ?? null,
    model: data.model ?? opts.models[0],
    tokensIn: data.usage?.prompt_tokens ?? null,
    tokensOut: data.usage?.completion_tokens ?? null,
    costUsd: data.usage?.cost ?? null,
  };
}

export async function embed(env: OpenRouterEnv, model: string, inputs: string[]): Promise<number[][]> {
  const data = await post<any>(env, 'embeddings', { model, input: inputs });
  return [...data.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
