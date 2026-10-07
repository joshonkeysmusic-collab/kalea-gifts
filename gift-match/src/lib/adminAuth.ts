/**
 * Admin password gate (loaded only when someone opens the admin login).
 *
 * This is a convenience lock, NOT security: the password is compiled into the app, so anyone determined
 * can read it from the downloaded code. It keeps casual visitors out of the admin screen. Real protection
 * needs a server-side check (see docs/catalogue-admin.md).
 *
 * Configure the password with VITE_ADMIN_PASSWORD (a .env file locally, an Environment Variable on Vercel).
 */
export const PLACEHOLDER_PASSWORD = 'kalea-admin';
export const MAX_TRIES = 5;
export const LOCK_MS = 30_000;

const configured = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim();
const SECRET = configured || PLACEHOLDER_PASSWORD;
const LOCK_KEY = 'kalea_admin_lock';

/** True while the placeholder is still the password, so the panel can nag until it is changed. */
export const usingPlaceholder = (secret = SECRET) => secret === PLACEHOLDER_PASSWORD;

export type LoginResult = { ok: true } | { ok: false; triesLeft: number; lockedForMs: number };
interface LockState { fails: number; until: number }

let memory: LockState = { fails: 0, until: 0 };
function read(): LockState {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK_KEY) || 'null') ?? memory;
  } catch {
    return memory;
  }
}
function write(s: LockState) {
  memory = s;
  try {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(s));
  } catch {
    /* memory copy still applies */
  }
}

/** Compare without stopping at the first different character. */
function same(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** Five wrong tries lock the form for 30 seconds. */
export function attemptLogin(input: string, secret = SECRET, now = Date.now()): LoginResult {
  const state = read();
  if (state.until > now) return { ok: false, triesLeft: 0, lockedForMs: state.until - now };
  if (same(input, secret)) {
    write({ fails: 0, until: 0 });
    return { ok: true };
  }
  const fails = state.until && state.until <= now ? 1 : state.fails + 1;
  if (fails >= MAX_TRIES) {
    write({ fails: 0, until: now + LOCK_MS });
    return { ok: false, triesLeft: 0, lockedForMs: LOCK_MS };
  }
  write({ fails, until: 0 });
  return { ok: false, triesLeft: MAX_TRIES - fails, lockedForMs: 0 };
}

export function resetLock(): void {
  write({ fails: 0, until: 0 });
}
