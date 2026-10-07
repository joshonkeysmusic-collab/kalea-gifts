import { describe, expect, it } from 'vitest';
import { BUDGET_ORDER } from './budgets';
import { SEED_CATALOG, mergeCatalog } from './catalog';
import { CoverageError, ONBOARDING_TIPS, assertCoverage, auditCatalog, formatCoverage } from './coverage';
import { productsFromJson } from './ingest';
import { CATEGORY_IDS, type Product } from './product';
import { compileProduct } from './rules';
import type { CatalogItem, CategoryId } from './types';
import { readFileSync } from 'node:fs';

const item = (id: string, category: CategoryId, price: number, extra: Partial<CatalogItem> = {}): CatalogItem => ({
  id, name: id, blurb: '', price, icon: 'gift', tone: '#000', interests: [], vibes: [], category, ...extra,
});

/** A catalogue with every category stocked twice, spread over prices, and every interest covered. */
function balanced(): CatalogItem[] {
  const interests = ['coffee', 'selfcare', 'flowers', 'beauty', 'wellness', 'home', 'books', 'treats', 'tech', 'travel'] as const;
  const prices = [40, 120, 240, 380, 560];
  return CATEGORY_IDS.flatMap((c, i) => [0, 1, 2].map((n) => item(`${c}-${n}`, c, prices[(i + n) % prices.length], { interests: [interests[(i + n) % interests.length]] })));
}

describe('auditCatalog', () => {
  it('passes a balanced catalogue', () => {
    const r = auditCatalog(balanced());
    expect(r.alerts.filter((a) => a.severity !== 'info')).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('flags a category with zero items as critical, with a tip', () => {
    const r = auditCatalog(balanced().filter((i) => i.category !== 'cakes'));
    const a = r.alerts.find((x) => x.scope === 'category' && x.key === 'cakes')!;
    expect(a).toMatchObject({ severity: 'critical', message: 'No Cakes items.' });
    expect(a.tip).toMatch(/at least 2 cakes items/);
    expect(r.byCategory.cakes).toBe(0);
    expect(r.ok).toBe(false);
    expect(r.alerts[0].severity).toBe('critical'); // critical alerts first
  });

  it('flags a category below the minimum, and honours per-category minimums', () => {
    const cat = balanced().filter((i) => i.id !== 'candles-1' && i.id !== 'candles-2');
    expect(auditCatalog(cat).alerts.find((a) => a.key === 'candles')).toMatchObject({ severity: 'warning', message: 'Only 1 Candles item (minimum 2).' });
    expect(auditCatalog(balanced(), { categoryMinimums: { cakes: 4 } }).alerts.find((a) => a.key === 'cakes')?.message).toBe('Only 3 Cakes items (minimum 4).');
    expect(auditCatalog(balanced(), { requiredCategories: ['coffee'] }).alerts.some((a) => a.scope === 'category')).toBe(false);
  });

  it('flags interests buyers can pick that nothing matches', () => {
    const none = balanced().map((i) => ({ ...i, interests: i.interests.filter((x) => x !== 'tech') }));
    expect(auditCatalog(none).alerts.find((a) => a.key === 'tech')).toMatchObject({ severity: 'critical', scope: 'interest' });
    const few = auditCatalog([...none, item('t1', 'tech', 50, { interests: ['tech'] })]);
    expect(few.alerts.find((a) => a.key === 'tech')).toMatchObject({ severity: 'warning', message: '"Tech & gadgets" matches only 1 item (minimum 3).' });
  });

  it('counts price bands and what is usable at each budget', () => {
    const r = auditCatalog([item('a', 'coffee', 85), item('b', 'coffee', 86), item('c', 'coffee', 285), item('d', 'coffee', 486)]);
    expect(r.byPriceBand).toEqual({ u100: 1, '100-200': 1, '200-300': 1, '300-500': 0, '500+': 1 });
    expect(r.availableByTier).toEqual({ u100: 1, '100-200': 2, '200-300': 3, '300-500': 3, '500+': 4 });
    expect(r.matrix.coffee.u100).toBe(1);
  });

  it('respects minBudget when counting what a tier can show', () => {
    const r = auditCatalog([item('a', 'coffee', 60, { minBudget: '200-300' })]);
    expect(r.availableByTier).toEqual({ u100: 0, '100-200': 0, '200-300': 1, '300-500': 1, '500+': 1 });
  });

  it('flags tiers with too few gifts and empty price bands', () => {
    const r = auditCatalog(balanced().filter((i) => i.price > 100));
    expect(r.alerts.find((a) => a.scope === 'tier' && a.key === 'u100' && a.severity === 'critical')).toBeTruthy();
    const top = auditCatalog(balanced().filter((i) => i.price < 500)).alerts.find((a) => a.scope === 'tier' && /500\+ band|AED 500\+ band/.test(a.message));
    expect(top?.tip).toMatch(/premium hero gift/);
  });

  it('flags gifts too expensive for any budget', () => {
    const r = auditCatalog([...balanced(), item('big', 'travel', 900)]);
    expect(r.alerts.find((a) => a.key === 'big')?.message).toMatch(/never be shown/);
  });

  it('ignores gift wrap and the card, and notes uncategorised items', () => {
    const r = auditCatalog([...balanced(), item('wrap', 'coffee', 15, { kind: 'base' }), { ...item('u', 'coffee', 50), category: undefined }]);
    expect(r.total).toBe(balanced().length + 1);
    expect(r.alerts.some((a) => a.severity === 'info' && /no category/.test(a.message))).toBe(true);
  });
});

describe('assertCoverage', () => {
  it('throws a CoverageError that carries the report when a category is empty', () => {
    const thin = balanced().filter((i) => i.category !== 'cakes');
    expect(() => assertCoverage(thin)).toThrow(CoverageError);
    try {
      assertCoverage(thin);
    } catch (e) {
      expect((e as CoverageError).message).toMatch(/No Cakes items/);
      expect((e as CoverageError).report.byCategory.cakes).toBe(0);
    }
  });

  it('throws on below-minimum by default, but failOn "critical" only on empty ones', () => {
    const below = balanced().filter((i) => i.id !== 'candles-1' && i.id !== 'candles-2');
    expect(() => assertCoverage(below)).toThrow(/Only 1 Candles item/);
    expect(() => assertCoverage(below, { failOn: 'critical' })).not.toThrow();
  });

  it('returns the report when everything is covered', () => {
    expect(assertCoverage(balanced()).ok).toBe(true);
  });
});

describe('the built-in catalogue and the templates', () => {
  it('shows the known gaps today: no cakes, nothing priced for AED 500+', () => {
    const r = auditCatalog(SEED_CATALOG);
    expect(r.byCategory.cakes).toBe(0);
    expect(r.alerts.some((a) => a.key === 'cakes' && a.severity === 'critical')).toBe(true);
    expect(r.byPriceBand['500+']).toBe(0);
    expect(r.total).toBe(55);
    for (const c of CATEGORY_IDS.filter((c) => c !== 'cakes')) expect(r.byCategory[c], c).toBeGreaterThanOrEqual(2);
  });

  it('adding the template cakes closes the cake gap', () => {
    const products = productsFromJson(readFileSync(new URL('../../catalog/products.template.json', import.meta.url), 'utf8')).products;
    const r = auditCatalog(mergeCatalog(SEED_CATALOG, products));
    expect(r.byCategory.cakes).toBe(2);
    expect(r.alerts.some((a) => a.key === 'cakes')).toBe(false);
  });

  it('formats a dashboard with an EMPTY marker, alerts and tips', () => {
    const text = formatCoverage(auditCatalog(SEED_CATALOG));
    expect(text).toMatch(/Cakes\s+0.*<- EMPTY/);
    expect(text).toMatch(/CRITICAL\s+No Cakes items\./);
    expect(text).toMatch(/Tip: Add at least 2 cakes items/);
    expect(text).toContain(BUDGET_ORDER.filter((t) => t !== 'u100').join(' ').split(' ')[0]);
  });

  it('ships onboarding tips', () => {
    expect(ONBOARDING_TIPS.length).toBeGreaterThanOrEqual(5);
  });
});

describe('compiled products keep their category', () => {
  it('carries the category through so the audit can count it', () => {
    const p: Product = { id: 'c', title: 'C', blurb: '', price: 90, category: 'cakes' };
    expect(compileProduct(p).category).toBe('cakes');
  });
});
