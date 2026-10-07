import { afterEach, describe, expect, it } from 'vitest';
import { SEED_CATALOG, getCatalog, mergeCatalog, setCustomProducts } from './catalog';
import { buildBox, eligible } from './engine';
import type { Product } from './product';
import { compileProduct } from './rules';
import type { CompleteAnswers } from './types';

const answers: CompleteAnswers = { who: 'friend', occasion: 'birthday', interests: ['treats'], vibes: ['joyful'], budget: '200-300', hearts: 1, details: {} };
const cake: Product = { id: 'my-cake', title: 'Birthday cake for two', blurb: 'Fresh.', price: 150, category: 'cakes', tags: ['birthday'] };

afterEach(() => setCustomProducts([]));

describe('mergeCatalog and the registry', () => {
  it('adds products, replaces by id in place, and removes inactive ones', () => {
    const first = SEED_CATALOG[0].id;
    const merged = mergeCatalog(SEED_CATALOG, [cake, { id: first, title: 'Replaced', blurb: '', price: 70, category: 'coffee' }, { id: 'candle', title: 'x', blurb: '', price: 1, category: 'candles', active: false }]);
    expect(merged.find((i) => i.id === 'my-cake')?.category).toBe('cakes');
    expect(merged[0]).toMatchObject({ id: first, name: 'Replaced' });
    expect(merged.some((i) => i.id === 'candle')).toBe(false);
    expect(merged).toHaveLength(SEED_CATALOG.length + 1 - 1);
  });

  it('getCatalog follows setCustomProducts', () => {
    const base = getCatalog().length;
    setCustomProducts([cake]);
    expect(getCatalog()).toHaveLength(base + 1);
    setCustomProducts([]);
    expect(getCatalog()).toHaveLength(base);
  });

  it('every built-in gift has a category', () => {
    expect(SEED_CATALOG.filter((i) => !i.kind && !i.category)).toEqual([]);
  });
});

describe('the engine with admin products', () => {
  it('recommends a matching product and respects the budget', () => {
    setCustomProducts([cake]);
    let picked = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const box = buildBox(answers, seed);
      expect(box.total).toBeLessThanOrEqual(300);
      if (box.items.some((i) => i.id === 'my-cake')) picked++;
    }
    expect(picked).toBeGreaterThan(10); // strong interest, vibe and occasion match
  });

  it('accepts an explicit catalogue without touching the global one', () => {
    const only = [compileProduct(cake)];
    const box = buildBox(answers, 1, only);
    expect(box.items.map((i) => i.id)).toContain('my-cake');
    expect(getCatalog().some((i) => i.id === 'my-cake')).toBe(false);
  });

  it('hides personalised and photo products until their requirements are met', () => {
    const custom = compileProduct({ ...cake, id: 'cc', tags: ['custom'] });
    expect(eligible(custom, { ...answers, hearts: 1 })).toBe(false);
    expect(eligible(custom, { ...answers, hearts: 2 })).toBe(true);
    const photo = compileProduct({ ...cake, id: 'pc', tags: ['photo'] });
    expect(eligible(photo, { ...answers, hearts: 3 })).toBe(false);
    expect(eligible(photo, { ...answers, hearts: 3, details: { hasPhoto: true } })).toBe(true);
  });

  it('applies recipient rules and the minimum budget tier', () => {
    const couple = compileProduct({ ...cake, id: 'cp', tags: ['couple'] });
    expect(eligible(couple, { ...answers, who: 'colleague' })).toBe(false);
    expect(eligible(couple, { ...answers, who: 'partner' })).toBe(true);
    const premium = compileProduct({ ...cake, id: 'pm', price: 90, minBudget: '300-500' });
    expect(eligible(premium, { ...answers, budget: '200-300' })).toBe(false);
    expect(eligible(premium, { ...answers, budget: '300-500' })).toBe(true);
  });

  it('still returns a valid box for many answer combinations once products are added', () => {
    setCustomProducts([cake, { ...cake, id: 'c2', title: 'Custom candle', category: 'candles', tags: ['custom'], price: 120 }, { id: 'c3', title: 'Eid sweets', blurb: '', price: 130, category: 'sweets', tags: ['eid'] }]);
    let n = 0;
    for (const who of ['partner', 'friend', 'colleague'] as const)
      for (const budget of ['u100', '100-200', '200-300', '300-500', '500+'] as const)
        for (const hearts of [1, 2, 3] as const) {
          const box = buildBox({ ...answers, who, budget, hearts, interests: ['home', 'treats'], vibes: ['cozy'] }, n++);
          const gifts = box.items.filter((i) => !i.kind);
          expect(gifts.length).toBeGreaterThan(0);
          expect(gifts.length).toBeLessThanOrEqual(5);
          expect(new Set(box.items.map((i) => i.id)).size).toBe(box.items.length);
        }
  });
});
