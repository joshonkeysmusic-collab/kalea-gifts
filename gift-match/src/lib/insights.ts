import type { GMEvent } from './analytics';

export interface Insights {
  sessions: number;
  started: number;
  completed: number;
  completionRate: number;
  intent: { yes: number; maybe: number; no: number };
  interests: [string, number][];
  occasions: [string, number][];
  hearts: [string, number][];
  optionalDetailsRate: number;
  shares: number;
  recipientViews: number;
  ratings: { love: number; nice: number; notme: number };
  challengeArrivals: number;
  feedback: { text: string; ts: number }[];
  daily: [string, number][];
  funnel: [string, number][];
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

function tally(values: string[]): [string, number][] {
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

const STEPS = ['who', 'occasion', 'interests', 'vibes', 'budget', 'hearts', 'details'];

export function aggregate(events: GMEvent[]): Insights {
  const bySid = new Map<string, GMEvent[]>();
  for (const e of events) {
    if (!e || typeof e.sid !== 'string') continue;
    (bySid.get(e.sid) ?? bySid.set(e.sid, []).get(e.sid)!).push(e);
  }
  const results = events.filter((e) => e.type === 'result');
  const lastResult = new Map<string, GMEvent>();
  results.forEach((e) => lastResult.set(e.sid, e));
  const completed = lastResult.size;
  const started = new Set(events.filter((e) => e.type === 'start').map((e) => e.sid)).size;

  const intentBySid = new Map<string, string>();
  events.filter((e) => e.type === 'intent').forEach((e) => intentBySid.set(e.sid, String(e.props?.answer)));
  const intents = [...intentBySid.values()];
  const intentTotal = intents.length;

  const answers = [...lastResult.values()].map((e) => e.props ?? {});
  const ratings = events.filter((e) => e.type === 'recipient_rating').map((e) => String(e.props?.rating));

  const days = tally(
    events.filter((e) => e.type === 'start').map((e) => new Date(e.ts).toISOString().slice(0, 10)),
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const reached = (step: string) =>
    new Set(events.filter((e) => e.type === 'step' && e.props?.step === step).map((e) => e.sid)).size;

  return {
    sessions: bySid.size,
    started,
    completed,
    completionRate: pct(completed, started),
    intent: {
      yes: pct(intents.filter((i) => i === 'yes').length, intentTotal),
      maybe: pct(intents.filter((i) => i === 'maybe').length, intentTotal),
      no: pct(intents.filter((i) => i === 'no').length, intentTotal),
    },
    interests: tally(answers.flatMap((a) => (a.interests as string[]) ?? [])).map(([k, v]) => [k, pct(v, completed)]),
    occasions: tally(answers.map((a) => String(a.occasion))).map(([k, v]) => [k, pct(v, completed)]),
    hearts: tally(answers.map((a) => String(a.hearts))).map(([k, v]) => [k, pct(v, completed)]),
    optionalDetailsRate: pct(answers.filter((a) => Number(a.detailsCount) > 0).length, completed),
    shares: events.filter((e) => e.type === 'share').length,
    recipientViews: events.filter((e) => e.type === 'recipient_open').length,
    ratings: {
      love: pct(ratings.filter((r) => r === 'love').length, ratings.length),
      nice: pct(ratings.filter((r) => r === 'nice').length, ratings.length),
      notme: pct(ratings.filter((r) => r === 'notme').length, ratings.length),
    },
    challengeArrivals: new Set(events.filter((e) => e.type === 'start' && e.props?.via).map((e) => e.sid)).size,
    feedback: events
      .filter((e) => (e.type === 'intent' || e.type === 'recipient_rating') && typeof e.props?.note === 'string' && e.props.note)
      .map((e) => ({ text: String(e.props!.note), ts: e.ts }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 20),
    daily: days,
    funnel: [['Started', started], ...STEPS.map((s) => [s, reached(s)] as [string, number]), ['Result', completed], ['Intent', intentTotal]],
  };
}
