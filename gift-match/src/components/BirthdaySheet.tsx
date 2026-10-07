import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { haptic } from './Motion';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "12 May" ⇄ { m: 4, d: 12 }. Birthdays are stored without a year. */
export function parseBirthday(s?: string): { m: number; d: number } | null {
  const match = s?.trim().match(/^(\d{1,2})\s+([A-Za-z]+)/);
  if (!match) return null;
  const m = MONTHS.findIndex((x) => x.toLowerCase().startsWith(match[2].toLowerCase().slice(0, 3)));
  const d = Number(match[1]);
  return m >= 0 && d >= 1 && d <= 31 ? { m, d } : null;
}

export function daysUntil(m: number, d: number, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), m, d);
  if (next < today) next = new Date(now.getFullYear() + 1, m, d);
  return { days: Math.round((next.getTime() - today.getTime()) / 86400000), weekday: DAYS[next.getDay()] };
}

export function BirthdaySheet({ value, onSet, onClose }: { value?: string; onSet: (v: string | undefined) => void; onClose: () => void }) {
  const now = new Date();
  const initial = parseBirthday(value);
  const [view, setView] = useState({ y: now.getFullYear(), m: initial?.m ?? now.getMonth() });
  const [sel, setSel] = useState(initial);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const cells = useMemo(() => {
    const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday first
    const count = new Date(view.y, view.m + 1, 0).getDate();
    return [...Array<null>(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [view]);

  const shift = (dir: number) =>
    setView((v) => {
      const m = v.m + dir;
      return m < 0 ? { y: v.y - 1, m: 11 } : m > 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m };
    });

  const until = sel ? daysUntil(sel.m, sel.d) : null;

  return createPortal(
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Choose their birthday">
        <div className="sheet-glow" />
        <div className="sheet-handle" />
        <div className="cal-head">
          <div>
            <span className="micro coral">THEIR BIRTHDAY</span>
            <span className="cal-month" aria-live="polite">{MONTHS[view.m]}</span>
          </div>
          <div className="cal-nav">
            <button className="sq-btn" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
            <button className="sq-btn" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="cal-grid cal-week" aria-hidden>
          {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="cal-grid" key={`${view.y}-${view.m}`}>
          {cells.map((d, i) =>
            d === null ? (
              <span key={`b${i}`} />
            ) : (
              <button
                key={d}
                className={
                  sel?.m === view.m && sel.d === d
                    ? 'sel'
                    : now.getFullYear() === view.y && now.getMonth() === view.m && now.getDate() === d
                      ? 'today'
                      : ''
                }
                aria-pressed={sel?.m === view.m && sel.d === d}
                aria-label={`${d} ${MONTHS[view.m]}`}
                onClick={() => {
                  haptic();
                  setSel({ m: view.m, d });
                }}
              >
                {d}
              </button>
            ),
          )}
        </div>
        <div className="cal-count">
          <strong>{until ? (until.days === 0 ? 'Today' : `${until.days}d`) : '—'}</strong>
          <span>
            {until
              ? until.days === 0
                ? "It's today! Same-day ideas first."
                : `until their birthday, a ${until.weekday}. Year optional.`
              : 'Pick a day and we’ll time the gift around it. Year optional.'}
          </span>
        </div>
        <div className="cal-actions">
          <button className="btn btn-outline" onClick={() => setSel(null)}>Clear</button>
          <button
            className="btn btn-dark center"
            onClick={() => {
              onSet(sel ? `${sel.d} ${MONTHS[sel.m]}` : undefined);
              onClose();
            }}
          >
            {sel ? `Set ${sel.d} ${MONTHS[sel.m].slice(0, 3)}` : 'Done'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
