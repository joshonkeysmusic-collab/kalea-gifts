import { describe, expect, it } from 'vitest';
import { buildBox, eligible } from './engine';
import { BUDGETS } from './budgets';
import { SEED_CATALOG as CATALOG } from './catalog';
import type { BudgetId, CompleteAnswers, HeartLevel, Interest, Occasion, Relationship, Vibe } from './types';

const base: CompleteAnswers = {
  who: 'friend',
  occasion: 'birthday',
  interests: ['coffee', 'selfcare'],
  vibes: ['cozy'],
  budget: '200-300',
  hearts: 2,
  details: { name: 'Sarah' },
};

const RELS: Relationship[] = ['partner', 'friend', 'family', 'colleague', 'other'];
const OCCS: Occasion[] = ['birthday', 'thankyou', 'celebration', 'newbeginning', 'anniversary', 'justbecause'];
const INTS: Interest[] = ['coffee', 'selfcare', 'flowers', 'beauty', 'wellness', 'home', 'books', 'treats', 'tech', 'travel'];
const VIBES: Vibe[] = ['cozy', 'elegant', 'joyful', 'romantic', 'minimal', 'natural'];
const BUDS = Object.keys(BUDGETS) as BudgetId[];
const HEARTS: HeartLevel[] = [1, 2, 3];

describe('buildBox', () => {
  it('names the recipient and stays within budget', () => {
    const box = buildBox(base, 7);
    expect(box.headline).toBe("Here's a match for Sarah");
    expect(box.total).toBeLessThanOrEqual(300);
    expect(box.items.some((i) => i.interests.includes('coffee'))).toBe(true);
  });

  it('is deterministic per seed and varies across seeds', () => {
    const ids = (s: number) => buildBox(base, s).items.map((i) => i.id).join();
    expect(ids(3)).toBe(ids(3));
    const variants = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(ids));
    expect(variants.size).toBeGreaterThan(1);
  });

  it('never gives romantic-only items to a colleague', () => {
    for (let s = 1; s < 20; s++) {
      const box = buildBox({ ...base, who: 'colleague', vibes: ['romantic'] }, s);
      expect(box.items.find((i) => i.relationships && !i.relationships.includes('colleague'))).toBeUndefined();
    }
  });

  it('leads with a personal piece at heart level 3', () => {
    const box = buildBox({ ...base, who: 'partner', hearts: 3, budget: '300-500' }, 1);
    expect(box.items.some((i) => i.minHearts)).toBe(true);
  });

  it('only uses photo items when a photo was added', () => {
    const a = { ...base, hearts: 3 as const, budget: '500+' as const };
    expect(CATALOG.filter((i) => i.needsPhoto).every((i) => !eligible(i, a))).toBe(true);
    expect(CATALOG.filter((i) => i.needsPhoto && !i.relationships).every((i) => eligible(i, { ...a, details: { hasPhoto: true } }))).toBe(true);
  });

  it('returns a valid box for every interest, budget, vibe and relationship', () => {
    let n = 0;
    for (const who of RELS)
      for (const budget of BUDS)
        for (const interest of INTS)
          for (const vibe of VIBES) {
            const hearts = HEARTS[n % 3];
            const occasion = OCCS[n % OCCS.length];
            const box = buildBox({ who, occasion, interests: [interest], vibes: [vibe], budget, hearts, details: {} }, n++);
            const real = box.items.filter((i) => !i.kind);
            expect(real.length).toBeGreaterThan(0);
            expect(real.length).toBeLessThanOrEqual(5);
            expect(box.total).toBeLessThanOrEqual(BUDGETS[budget].max);
            expect(new Set(box.items.map((i) => i.id)).size).toBe(box.items.length);
            expect(box.subtitle).not.toMatch(/undefined/);
          }
  });

  it('spends a sensible share of larger budgets', () => {
    for (const budget of ['200-300', '300-500', '500+'] as BudgetId[]) {
      const box = buildBox({ ...base, interests: ['coffee', 'selfcare', 'home'], vibes: ['cozy', 'elegant'], budget }, 2);
      expect(box.total).toBeGreaterThanOrEqual(BUDGETS[budget].min * 0.8);
    }
  });
});
