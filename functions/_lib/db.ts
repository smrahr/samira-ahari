// Minimal Supabase (PostgREST) client over fetch. Server-only: uses the secret key, which bypasses RLS.

export type DbEnv = { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string };

export class DbError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`supabase ${status}: ${body}`);
    this.status = status;
  }
}

export function db(env: DbEnv) {
  const base = env.SUPABASE_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '') + '/rest/v1';
  const headers = { apikey: env.SUPABASE_SERVICE_KEY, 'content-type': 'application/json' };

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${base}/${path}`, { ...init, headers: { ...headers, ...init.headers } });
    const text = await res.text();
    if (!res.ok) throw new DbError(res.status, text);
    return (text ? JSON.parse(text) : null) as T;
  };

  return {
    select: <T>(table: string, query: string) => request<T[]>(`${table}?${query}`),

    insert: <T = unknown>(table: string, rows: object | object[], { ignoreDuplicates = false } = {}) =>
      request<T[]>(table, {
        method: 'POST',
        body: JSON.stringify(rows),
        headers: {
          Prefer: ['return=representation', ignoreDuplicates && 'resolution=ignore-duplicates']
            .filter(Boolean)
            .join(','),
        },
      }),

    update: (table: string, filter: string, patch: object) =>
      request(`${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(patch) }),

    remove: (table: string, filter: string) => request(`${table}?${filter}`, { method: 'DELETE' }),

    rpc: <T>(fn: string, args: object) =>
      request<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }),
  };
}

// pgvector accepts the '[1,2,3]' text form for vector / halfvec columns
export const toVector = (embedding: number[]) => `[${embedding.join(',')}]`;
