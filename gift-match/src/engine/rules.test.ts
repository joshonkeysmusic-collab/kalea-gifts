import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, compileProduct, describeTrigger, generateRules, normaliseTags } from './rules';
import { CATEGORY_IDS } from './product';
import type { Product } from './product';

const p = (over: Partial<Product>): Product => ({ id: 'x', title: 'X', blurb: 'b', price: 100, category: 'candles', ...over });

describe('generateRules', () => {
  it('starts from the category defaults', () => {
    const r = generateRules(p({}));
    expect(r.interests).toEqual(['home', 'selfcare']);
    expect(r.vibes).toEqual(['cozy', 'romantic']);
    expect(r.minHearts).toBeUndefined();
  });

  it('adds occasion boosts for cakes and tags', () => {
    const r = generateRules(p({ category: 'cakes', tags: ['Birthday', 'eid'] }));
    expect(r.interests).toEqual(['treats']);
    // Tags outrank the category's defaults when the cap of 3 forces a choice, so "eid" is not lost.
    expect(r.occasions).toEqual(['birthday', 'celebration', 'thankyou']);
    expect(generateRules(p({ category: 'cakes' })).occasions).toEqual(['birthday', 'celebration', 'anniversary']);
  });

  it('maps personalisation tags to unlock levels', () => {
    expect(generateRules(p({ tags: ['custom'] })).minHearts).toBe(2);
    expect(generateRules(p({ tags: ['custom', 'bespoke'] })).minHearts).toBe(3);
    const photo = generateRules(p({ tags: ['photo'] }));
    expect(photo.needsPhoto).toBe(true);
    expect(photo.minHearts).toBeGreaterThanOrEqual(2);
    expect(generateRules(p({ category: 'personalised', interests: ['books'] })).minHearts).toBe(2);
  });

  it('maps who-it-is-for tags to recipient rules', () => {
    expect(generateRules(p({ tags: ['couple'] })).recipients).toEqual(['partner']);
    expect(generateRules(p({ tags: ['corporate'] })).recipients).toEqual(['colleague']);
    expect(generateRules(p({})).recipients).toEqual([]);
  });

  it('never exceeds the sizes the engine was tuned for', () => {
    const r = generateRules(p({ tags: ['coffee', 'books', 'tech', 'travel', 'cozy', 'luxury', 'minimal', 'fun'] }));
    expect(r.interests.length).toBeLessThanOrEqual(3);
    expect(r.vibes.length).toBeLessThanOrEqual(3);
  });

  it('lets explicit fields replace generated ones', () => {
    const r = generateRules(p({ interests: ['coffee'], vibes: ['minimal'], occasions: ['thankyou'], recipients: ['friend'], unlock: { hearts: 3 } }));
    expect(r).toMatchObject({ interests: ['coffee'], vibes: ['minimal'], occasions: ['thankyou'], recipients: ['friend'], minHearts: 3 });
  });

  it('warns when an item has nothing to match on', () => {
    expect(generateRules(p({ category: 'experiences' })).warnings.join(' ')).toMatch(/No interest matched/);
    expect(generateRules(p({ category: 'experiences', tags: ['spa'] })).warnings).toEqual([]);
    expect(generateRules(p({ category: 'personalised' })).warnings.join(' ')).not.toMatch(/No interest/); // unlocks by level
  });

  it('ignores unknown tags without error', () => {
    expect(generateRules(p({ tags: ['zzz-unknown'] })).interests).toEqual(['home', 'selfcare']);
    expect(normaliseTags(['  Soy Wax ', 'soy-wax', ''])).toEqual(['soy-wax']);
  });
});

describe('compileProduct', () => {
  it('produces a clean CatalogItem the engine can score', () => {
    const item = compileProduct(p({ price: 94.6, tags: ['Luxury'], imageUrl: '/x.jpg' }));
    expect(item).toMatchObject({ id: 'x', name: 'X', price: 95, category: 'candles', imageUrl: '/x.jpg', icon: 'flame', tags: ['luxury'] });
    expect(JSON.parse(JSON.stringify(item))).toEqual(item); // no undefined keys
  });

  it('every category has a real icon', () => {
    const icons = readFileSync(new URL('../components/Icon.tsx', import.meta.url), 'utf8');
    for (const c of CATEGORY_IDS) expect(icons, `icon for ${c}`).toMatch(new RegExp(`\\b${CATEGORIES[c].icon}:`));
  });
});

describe('describeTrigger', () => {
  it('explains the rules in plain words', () => {
    const text = describeTrigger(compileProduct(p({ category: 'cakes', price: 220, tags: ['custom', 'birthday'] })));
    expect(text).toMatch(/Interest match: Sweet treats/);
    expect(text).toMatch(/Occasion boost \(\+1\): Birthday/);
    expect(text).toMatch(/personalisation level 2/);
    expect(text).toMatch(/Earliest budget tier: AED 200 – 300/);
  });
});
