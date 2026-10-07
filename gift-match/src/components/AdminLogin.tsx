import { Eye, EyeOff, Lock } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { setAdminSession } from '../lib/adminSession';

/**
 * Password challenge for the admin panel. The password check lives in lib/adminAuth, which is only
 * downloaded when someone actually submits the form, so ordinary visitors never load it.
 * `page` mode is used when /#/admin is opened directly without being signed in.
 */
export function AdminLogin({ onSuccess, onCancel, mode = 'modal' }: { onSuccess: () => void; onCancel?: () => void; mode?: 'modal' | 'page' }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const locked = lockedUntil > now;

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (mode !== 'modal' || !onCancel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onCancel]);
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [locked]);
  useEffect(() => {
    if (lockedUntil && !locked) setError(null);
  }, [lockedUntil, locked]);

  const seconds = Math.ceil((lockedUntil - now) / 1000);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || locked || !pw) return;
    setBusy(true);
    const { attemptLogin } = await import('../lib/adminAuth');
    const r = attemptLogin(pw);
    setBusy(false);
    if (r.ok) {
      setAdminSession(true);
      onSuccess();
      return;
    }
    setPw('');
    setShake((n) => n + 1);
    const t = Date.now();
    setNow(t);
    if (r.lockedForMs) {
      setLockedUntil(t + r.lockedForMs);
      setError('Too many wrong tries.');
    } else {
      setError(`That password isn't right. ${r.triesLeft} ${r.triesLeft === 1 ? 'try' : 'tries'} left.`);
    }
    input.current?.focus();
  };

  const card = (
    <form
      key={shake}
      className={`admin-login ${shake ? 'shake' : ''} ${mode}`}
      role="dialog"
      aria-modal={mode === 'modal'}
      aria-labelledby="al-title"
      onSubmit={submit}
    >
      <span className="al-icon"><Lock size={22} strokeWidth={2} /></span>
      <h2 id="al-title">Admin access</h2>
      <p className="al-sub">Enter the password to manage products.</p>
      <label className="micro" htmlFor="al-pw">PASSWORD</label>
      <div className="pw-wrap">
        <input
          id="al-pw"
          ref={input}
          type={show ? 'text' : 'password'}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
          autoCapitalize="none"
          spellCheck={false}
          disabled={locked}
          aria-describedby="al-error"
        />
        <button type="button" className="pw-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <p id="al-error" className="al-error" role="alert">
        {locked ? `${error ?? ''} Try again in ${seconds}s.` : error}
      </p>
      <div className="al-actions">
        {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-dark center" disabled={!pw || locked || busy}>Unlock</button>
      </div>
    </form>
  );

  if (mode === 'page') return <div className="admin-login-page">{card}</div>;
  return createPortal(
    <div className="admin-login-layer">
      <div className="sheet-backdrop" onClick={onCancel} />
      {card}
    </div>,
    document.body,
  );
}
