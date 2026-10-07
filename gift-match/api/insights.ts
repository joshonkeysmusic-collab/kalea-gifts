import { readEvents, storeConfigured } from './_store';
import { aggregate } from '../src/lib/insights';
import type { GMEvent } from '../src/lib/analytics';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  const expected = process.env.FOUNDER_KEY;
  if (!expected) return json({ error: 'Set FOUNDER_KEY in Vercel environment variables to enable live insights.' }, 503);
  if (key !== expected) return json({ error: 'Wrong founder key.' }, 401);
  if (!storeConfigured()) return json({ error: 'Connect Upstash Redis (Vercel → Storage) to collect live data.' }, 503);
  const events: GMEvent[] = [];
  for (const line of await readEvents()) {
    try {
      events.push(JSON.parse(line));
    } catch {
      /* skip corrupt line */
    }
  }
  return json(aggregate(events));
}
