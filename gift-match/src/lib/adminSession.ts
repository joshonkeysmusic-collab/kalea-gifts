/**
 * Whether this browser tab has unlocked the admin panel. Kept tiny because it ships with the main app.
 * Falls back to memory when sessionStorage is blocked (private mode, embedded previews), so signing in
 * still works for as long as the page stays open.
 */
const KEY = 'kalea_admin_session';
let memory = false;

export function isAdminSession(): boolean {
  if (memory) return true;
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setAdminSession(on: boolean): void {
  memory = on;
  try {
    if (on) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {
    /* blocked: the in-memory flag above still applies */
  }
}
