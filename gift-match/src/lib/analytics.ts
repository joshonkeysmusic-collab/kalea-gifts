export interface GMEvent {
  type: string;
  sid: string;
  ts: number;
  props?: Record<string, unknown>;
}

const LOCAL_KEY = 'gm_events';

function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

let sid = '';
export function sessionId(): string {
  if (!sid) {
    try {
      sid = sessionStorage.getItem('gm_sid') || newId();
      sessionStorage.setItem('gm_sid', sid);
    } catch {
      sid = newId();
    }
  }
  return sid;
}

export function resetSession() {
  sid = newId();
  try {
    sessionStorage.setItem('gm_sid', sid);
  } catch {
    /* private mode */
  }
}

export function localEvents(): GMEvent[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

export function track(type: string, props?: Record<string, unknown>) {
  const ev: GMEvent = { type, sid: sessionId(), ts: Date.now(), props };
  try {
    const all = localEvents();
    all.push(ev);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(-500)));
  } catch {
    /* storage full or blocked: remote log still runs */
  }
  if (import.meta.env.DEV && !import.meta.env.VITE_API) return;
  const body = JSON.stringify(ev);
  try {
    if (navigator.sendBeacon?.('/api/event', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    /* fall through */
  }
  fetch('/api/event', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
}
