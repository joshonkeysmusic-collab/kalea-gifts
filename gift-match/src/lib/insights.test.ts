import { describe, expect, it } from 'vitest';
import { aggregate } from './insights';

const ev = (type: string, sid: string, props?: Record<string, unknown>) => ({ type, sid, ts: Date.UTC(2026, 9, 5), props });

describe('aggregate', () => {
  it('computes completion, intent split, interests and ratings', () => {
    const r = aggregate([
      ev('start', 'a'), ev('start', 'b'), ev('start', 'c', { via: 'challenge' }),
      ev('result', 'a', { interests: ['coffee', 'selfcare'], occasion: 'birthday', hearts: 2, detailsCount: 1 }),
      ev('result', 'b', { interests: ['coffee'], occasion: 'thankyou', hearts: 1, detailsCount: 0 }),
      ev('intent', 'a', { answer: 'yes', note: 'lovely' }), ev('intent', 'b', { answer: 'no' }),
      ev('recipient_rating', 'z', { rating: 'love' }),
    ]);
    expect(r.started).toBe(3);
    expect(r.completed).toBe(2);
    expect(r.completionRate).toBe(67);
    expect(r.intent).toEqual({ yes: 50, maybe: 0, no: 50 });
    expect(r.interests[0]).toEqual(['coffee', 100]);
    expect(r.optionalDetailsRate).toBe(50);
    expect(r.ratings.love).toBe(100);
    expect(r.challengeArrivals).toBe(1);
    expect(r.feedback[0].text).toBe('lovely');
  });
  it('handles no data', () => {
    const r = aggregate([]);
    expect(r.completed).toBe(0);
    expect(r.intent.yes).toBe(0);
  });
});
