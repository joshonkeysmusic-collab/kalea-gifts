import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { aggregate, type Insights } from '../lib/insights';
import { localEvents } from '../lib/analytics';
import { INTEREST_WORDS, OCCASION_WORDS } from '../engine/words';

const LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(INTEREST_WORDS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(OCCASION_WORDS).map(([k, v]) => [k, v.label])),
  home: 'Home / calm',
  tech: 'Tech',
  treats: 'Treats',
  '1': '♥ Thoughtful',
  '2': '♥♥ Personal',
  '3': '♥♥♥ Made for them',
  who: 'Who',
  occasion: 'Occasion',
  interests: 'Interests',
  vibes: 'Vibe',
  budget: 'Budget',
  hearts: 'Hearts',
  details: 'Details',
};
const label = (k: string) => LABELS[k] ?? k;

export function Founder() {
  const [key, setKey] = useState(() => {
    try {
      return new URLSearchParams(window.location.hash.split('?')[1]).get('key') || localStorage.getItem('gm_founder_key') || '';
    } catch {
      return '';
    }
  });
  const [data, setData] = useState<Insights | null>(null);
  const [source, setSource] = useState<'live' | 'local'>('local');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/insights?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        setData(await res.json());
        setSource('live');
        try {
          localStorage.setItem('gm_founder_key', key);
        } catch {
          /* ignore */
        }
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `Live data unavailable (${res.status}).`);
    } catch {
      setError('Live data unavailable (no API in this environment).');
    }
    setData(aggregate(localEvents()));
    setSource('local');
  }, [key]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="founder">
      <header className="f-head">
        <div>
          <h1>Kalea Gifts Insights</h1>
          <p className="f-sub">{source === 'live' ? 'Live · all users' : 'This device only'}</p>
        </div>
        <button className="f-refresh" onClick={load} aria-label="Refresh"><RefreshCw size={16} /></button>
      </header>

      {source === 'local' && (
        <form className="f-key" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input placeholder="Founder key" value={key} onChange={(e) => setKey(e.target.value)} type="password" />
          <button>Connect</button>
          {error && <p>{error}</p>}
        </form>
      )}

      {data && (
        <>
          <div className="f-kpis">
            <Kpi value={data.completed} label="Completed matches" />
            <Kpi value={`${data.intent.yes}%`} label="Would buy (Yes)" />
            <Kpi value={`${data.intent.maybe}%`} label="Maybe" />
            <Kpi value={`${data.intent.no}%`} label="No" />
          </div>
          <div className="f-kpis">
            <Kpi value={data.started} label="Started" />
            <Kpi value={`${data.completionRate}%`} label="Completion" />
            <Kpi value={data.shares} label="Shares" />
            <Kpi value={data.recipientViews} label="Recipient opens" />
          </div>

          <Card title="Goal: 15 users this week">
            <Bars rows={[['Unique sessions', data.sessions]]} max={15} unit="" />
          </Card>

          <Card title="Funnel (people reaching each step)">
            <Bars rows={data.funnel.map(([k, v]) => [label(k), v])} max={Math.max(1, data.funnel[0]?.[1] ?? 1)} unit="" />
          </Card>

          <Card title="Top interests (% of matches)">
            <Bars rows={data.interests.map(([k, v]) => [label(k), v])} />
          </Card>

          <div className="f-grid">
            <Card title="Occasions">
              <Bars rows={data.occasions.map(([k, v]) => [label(k), v])} compact />
            </Card>
            <Card title="Heart level selected">
              <Bars rows={data.hearts.map(([k, v]) => [label(k), v])} compact />
            </Card>
          </div>

          <Card title="Added optional details">
            <Bars rows={[['With details', data.optionalDetailsRate]]} />
          </Card>

          <Card title={`Recipient verdicts · ${data.recipientViews} opened`}>
            {data.ratings.love + data.ratings.nice + data.ratings.notme === 0 ? (
              <p className="f-empty">No ratings yet. Ask testers to use "Send to…" after their match.</p>
            ) : <Bars rows={[['Love it', data.ratings.love], ["It's nice", data.ratings.nice], ['Not quite me', data.ratings.notme]]} />}
          </Card>

          <Card title="Latest feedback">
            {data.feedback.length ? (
              <ul className="f-feedback">
                {data.feedback.map((f) => (
                  <li key={f.ts + f.text}>
                    “{f.text}” <time>{new Date(f.ts).toLocaleDateString()}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="f-empty">No written feedback yet.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="f-kpi">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="f-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Bars({ rows, max = 100, unit = '%', compact }: { rows: [string, number][]; max?: number; unit?: string; compact?: boolean }) {
  if (!rows.length) return <p className="f-empty">No data yet.</p>;
  return (
    <ul className={`f-bars ${compact ? 'compact' : ''}`}>
      {rows.map(([k, v]) => (
        <li key={k} title={`${k}: ${v}${unit}`}>
          <span className="f-bar-label">{k}</span>
          <span className="f-bar-track">
            <span className="f-bar-fill" style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
          </span>
          <span className="f-bar-value">{v}{unit}</span>
        </li>
      ))}
    </ul>
  );
}
