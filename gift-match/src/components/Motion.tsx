import { useEffect, useRef, useState, type ReactNode } from 'react';

export type Direction = 'fwd' | 'back';
export type TransitionKind = 'slide' | 'scene';

const EXIT_MS = 460;

/**
 * Keeps the outgoing page mounted while the new one enters, so both can
 * animate (crossfade + directional slide). Layers share one grid cell, so
 * no absolute positioning or measuring is needed.
 */
export function PageTransition({ id, dir = 'fwd', kind = 'slide', children }: {
  id: string;
  dir?: Direction;
  kind?: TransitionKind;
  children: ReactNode;
}) {
  const [state, setState] = useState<{ id: string; prevId: string | null; prevNode: ReactNode }>({ id, prevId: null, prevNode: null });
  const last = useRef<ReactNode>(children);

  // Derived state: when the page id changes, remember what was on screen.
  if (state.id !== id) setState({ id, prevId: state.id, prevNode: last.current });

  useEffect(() => {
    last.current = children;
  });

  useEffect(() => {
    if (!state.prevId) return;
    const t = setTimeout(() => setState((s) => ({ ...s, prevId: null, prevNode: null })), EXIT_MS);
    return () => clearTimeout(t);
  }, [state.prevId]);

  return (
    <div className={`pt pt-${kind} pt-${dir}`}>
      {state.prevId && (
        <div key={state.prevId} className="pt-layer pt-exit" aria-hidden {...{ inert: '' }}>
          {state.prevNode}
        </div>
      )}
      <div key={id} className="pt-layer pt-enter pt-current">
        {children}
      </div>
    </div>
  );
}

/** A one-shot burst of sparkles/hearts radiating from the centre of its parent. */
export function Burst({ fire, kind = 'sparkle', count = 16 }: { fire: unknown; kind?: 'sparkle' | 'heart'; count?: number }) {
  const [shots, setShots] = useState<number[]>([]);
  useEffect(() => {
    if (!fire) return;
    const id = Date.now();
    setShots((s) => [...s, id]);
    const t = setTimeout(() => setShots((s) => s.filter((x) => x !== id)), 1400);
    return () => clearTimeout(t);
  }, [fire]);

  return (
    <span className="burst" aria-hidden>
      {shots.map((shot) =>
        Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2 + (shot % 7) * 0.1;
          const dist = 70 + ((i * 37) % 60);
          return (
            <span
              key={`${shot}-${i}`}
              className={`burst-p ${kind}`}
              style={{
                ['--x' as string]: `${Math.cos(angle) * dist}px`,
                ['--y' as string]: `${Math.sin(angle) * dist}px`,
                ['--r' as string]: `${(i * 47) % 360}deg`,
                ['--s' as string]: `${0.6 + ((i * 13) % 10) / 15}`,
                animationDelay: `${(i % 4) * 25}ms`,
              }}
            >
              {kind === 'heart' ? '♥' : '✦'}
            </span>
          );
        }),
      )}
    </span>
  );
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Counts up to `to` with an ease-out curve, restarting whenever `to` changes. */
export function useCountUp(to: number, ms = 900, delay = 250) {
  const [v, setV] = useState(reduced() ? to : 0);
  useEffect(() => {
    if (reduced()) return setV(to);
    let raf = 0;
    let start = 0; // anchored to the first frame's own clock
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const p = Math.min(1, Math.max(0, (now - start) / ms));
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, delay]);
  return v;
}

export function haptic() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* unsupported */
  }
}
