import { appendEvent, storeConfigured } from './_store';

const ALLOWED = new Set(['start', 'step', 'result', 'shuffle', 'intent', 'share', 'recipient_open', 'recipient_rating']);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export function sanitize(raw: string): string | null {
  if (raw.length > 4000) return null;
  let ev: { type?: unknown; sid?: unknown; ts?: unknown; props?: unknown };
  try {
    ev = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof ev.type !== 'string' || !ALLOWED.has(ev.type)) return null;
  if (typeof ev.sid !== 'string' || !/^[a-z0-9]{4,40}$/i.test(ev.sid)) return null;
  const props = ev.props && typeof ev.props === 'object' && !Array.isArray(ev.props) ? ev.props : undefined;
  // Server time is the source of truth; client clocks drift.
  return JSON.stringify({ type: ev.type, sid: ev.sid, ts: Date.now(), props });
}

export async function POST(request: Request) {
  const clean = sanitize(await request.text());
  if (!clean) return json({ ok: false, error: 'invalid event' }, 400);
  if (!storeConfigured()) return json({ ok: true, stored: false });
  try {
    await appendEvent(clean);
    return json({ ok: true, stored: true });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 502);
  }
}
