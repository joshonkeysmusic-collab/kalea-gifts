/**
 * Tiny Upstash Redis REST client (no dependencies).
 * Works with the free "Upstash for Redis" Vercel Marketplace integration,
 * which injects KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*).
 */
const KEY = 'gm:events';

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export const storeConfigured = () => creds() !== null;

async function redis(command: (string | number)[]) {
  const c = creds();
  if (!c) throw new Error('Storage not configured');
  const res = await fetch(c.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return (await res.json()).result;
}

export async function appendEvent(json: string) {
  await redis(['RPUSH', KEY, json]);
}

export async function readEvents(): Promise<string[]> {
  return (await redis(['LRANGE', KEY, 0, 49999])) ?? [];
}
