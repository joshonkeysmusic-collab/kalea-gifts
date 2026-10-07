import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

export function Shell({ children, step, total, onBack, onRestart, hideProgress }: {
  children: ReactNode;
  step: number;
  total: number;
  onBack?: () => void;
  onRestart?: () => void;
  hideProgress?: boolean;
}) {
  return (
    <div className="app">
      <header className="topbar">
        {onBack ? (
          <button className="round-btn" onClick={onBack} aria-label="Back">
            <ChevronLeft size={18} />
          </button>
        ) : <span className="round-spacer" />}
        <div className="progress" aria-hidden={hideProgress} style={{ opacity: hideProgress ? 0 : 1 }}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i + 1 < step ? 'done' : i + 1 === step ? 'now' : ''} />
          ))}
        </div>
        <span className="step-count" aria-label={`Step ${step} of ${total}`} style={{ opacity: hideProgress ? 0 : 1 }}>
          {step}/{total}
        </span>
        {onRestart ? (
          <button className="round-btn" onClick={onRestart} aria-label="Start over">
            <RotateCcw size={16} />
          </button>
        ) : <span className="round-spacer" />}
      </header>
      <main className="screen">{children}</main>
    </div>
  );
}

/** A word on a tilted colour block, thumbnail-style. */
export function Hl({ children, tone = 'coral' }: { children: ReactNode; tone?: 'coral' | 'gold' }) {
  return <span className={`hl ${tone}`}>{children}</span>;
}

export function Heading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="heading">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function Hearts({ n, size = 18 }: { n: number; size?: number }) {
  return (
    <span className="hearts" aria-label={`${n} heart${n > 1 ? 's' : ''}`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2.2 4.5 6 4.5c2.2 0 3.6 1.2 4.4 2.4h3.2c.8-1.2 2.2-2.4 4.4-2.4 3.8 0 5.7 3.9 4 7.2C19.5 16.4 12 21 12 21z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

export function Toast({ text }: { text: string | null }) {
  return <div className={`toast ${text ? 'show' : ''}`} role="status">{text}</div>;
}
