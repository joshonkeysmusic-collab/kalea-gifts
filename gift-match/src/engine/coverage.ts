import { BUDGET_ORDER, BUDGETS, WRAP_COST, earliestTier } from './budgets';
import { CATEGORY_IDS, INTERESTS } from './product';
import { CATEGORIES } from './rules';
import { INTEREST_WORDS } from './words';
import type { BudgetId, CatalogItem, CategoryId, Interest } from './types';

/* =====================================================================
   Category balance & coverage tracker
   ---------------------------------------------------------------------
   Audits a catalogue so gaps show up BEFORE launch. Three views:
     - by category  (what Katya stocks)
     - by interest  (what buyers actually tap, so the one that drives matches)
     - by price     (how many gifts exist at each budget)
   `auditCatalog` reports. `assertCoverage` throws when the catalogue is
   too thin, so it can gate a launch or a deploy.
   ===================================================================== */

export type Severity = 'info' | 'warning' | 'critical';
const RANK: Record<Severity, number> = { info: 0, warning: 1, critical: 2 };

export interface CoverageAlert {
  severity: Severity;
  scope: 'overall' | 'category' | 'interest' | 'tier';
  /** Category id, interest id or budget tier id the alert is about. */
  key?: string;
  message: string;
  /** What to do about it, in plain words. */
  tip: string;
}

export interface CoverageOptions {
  /** Fewest items a category should have. Default 2. */
  minPerCategory?: number;
  /** Per-category overrides of the minimum, for example { cakes: 3 }. */
  categoryMinimums?: Partial<Record<CategoryId, number>>;
  /** Categories that must be stocked. Default: all of them. */
  requiredCategories?: CategoryId[];
  /** Fewest items that should match each interest buyers can pick. Default 3. */
  minPerInterest?: number;
  /** Fewest gifts that should be affordable at each budget tier. Default 8. */
  minPerTier?: number;
  /** Fewest gifts overall. Default 20. */
  minTotal?: number;
}

export const COVERAGE_DEFAULTS = { minPerCategory: 2, minPerInterest: 3, minPerTier: 8, minTotal: 20 } as const;

export interface CoverageReport {
  /** Gifts counted (gift wrap and the card are excluded). */
  total: number;
  byCategory: Record<CategoryId, number>;
  byInterest: Record<Interest, number>;
  /** Gifts by the price band they sit in: the cheapest tier each one fits. */
  byPriceBand: Record<BudgetId, number>;
  /** Gifts a buyer in this tier can actually be shown (affordable and not gated above the tier). */
  availableByTier: Record<BudgetId, number>;
  /** Category by price band. */
  matrix: Record<CategoryId, Record<BudgetId, number>>;
  alerts: CoverageAlert[];
  /** True when there are no warnings or critical alerts. */
  ok: boolean;
}

const zero = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function auditCatalog(catalog: CatalogItem[], opts: CoverageOptions = {}): CoverageReport {
  const minCat = opts.minPerCategory ?? COVERAGE_DEFAULTS.minPerCategory;
  const minInterest = opts.minPerInterest ?? COVERAGE_DEFAULTS.minPerInterest;
  const minTier = opts.minPerTier ?? COVERAGE_DEFAULTS.minPerTier;
  const minTotal = opts.minTotal ?? COVERAGE_DEFAULTS.minTotal;
  const required = opts.requiredCategories ?? CATEGORY_IDS;

  const gifts = catalog.filter((i) => !i.kind);
  const byCategory = zero(CATEGORY_IDS);
  const byInterest = zero(INTERESTS);
  const byPriceBand = zero(BUDGET_ORDER);
  const availableByTier = zero(BUDGET_ORDER);
  const matrix = Object.fromEntries(CATEGORY_IDS.map((c) => [c, zero(BUDGET_ORDER)])) as Record<CategoryId, Record<BudgetId, number>>;
  const overpriced: CatalogItem[] = [];
  const uncategorised: CatalogItem[] = [];

  for (const g of gifts) {
    if (g.category) byCategory[g.category]++;
    else uncategorised.push(g);
    for (const i of g.interests) byInterest[i]++;
    const band = earliestTier(g.price);
    if (band) {
      byPriceBand[band]++;
      if (g.category) matrix[g.category][band]++;
    } else overpriced.push(g);
    const floor = g.minBudget ? BUDGET_ORDER.indexOf(g.minBudget) : 0;
    BUDGET_ORDER.forEach((tier, idx) => {
      if (idx >= floor && g.price <= BUDGETS[tier].max - WRAP_COST) availableByTier[tier]++;
    });
  }

  const alerts: CoverageAlert[] = [];
  const add = (a: CoverageAlert) => alerts.push(a);

  if (gifts.length < minTotal) {
    add({
      severity: gifts.length === 0 ? 'critical' : 'warning', scope: 'overall',
      message: `Only ${gifts.length} gift${gifts.length === 1 ? '' : 's'} in the catalogue (aim for at least ${minTotal}).`,
      tip: 'A thin catalogue makes every box look the same. Add more gifts across several categories before launch.',
    });
  }

  for (const c of required) {
    const n = byCategory[c];
    const min = opts.categoryMinimums?.[c] ?? minCat;
    const cat = CATEGORIES[c];
    if (n === 0) {
      add({
        severity: 'critical', scope: 'category', key: c,
        message: `No ${cat.label} items.`,
        tip: `Add at least ${min} ${lower(cat.label)} items at different prices. ${cat.hint}.`,
      });
    } else if (n < min) {
      add({
        severity: 'warning', scope: 'category', key: c,
        message: `Only ${n} ${cat.label} item${n === 1 ? '' : 's'} (minimum ${min}).`,
        tip: `Add ${min - n} more ${lower(cat.label)} item${min - n === 1 ? '' : 's'}, ideally at a different price from the one you have.`,
      });
    } else if (n >= 2 && BUDGET_ORDER.filter((t) => matrix[c][t] > 0).length === 1) {
      add({
        severity: 'info', scope: 'category', key: c,
        message: `All ${n} ${cat.label} items sit in one price band.`,
        tip: 'Mix a small treat, a mid-range gift and one premium piece so every budget has a choice.',
      });
    }
  }

  for (const i of INTERESTS) {
    const n = byInterest[i];
    const label = INTEREST_WORDS[i].label;
    if (n === 0) {
      add({
        severity: 'critical', scope: 'interest', key: i,
        message: `Nothing matches the "${label}" interest.`,
        tip: `Buyers who pick "${label}" get no relevant gift. Add items in a related category, or set "${i}" under interests.`,
      });
    } else if (n < minInterest) {
      add({
        severity: 'warning', scope: 'interest', key: i,
        message: `"${label}" matches only ${n} item${n === 1 ? '' : 's'} (minimum ${minInterest}).`,
        tip: `Buyers who pick "${label}" will see the same gift again and again. Add ${minInterest - n} more that match it.`,
      });
    }
  }

  for (const t of BUDGET_ORDER) {
    const avail = availableByTier[t];
    if (avail < minTier) {
      add({
        severity: avail === 0 ? 'critical' : 'warning', scope: 'tier', key: t,
        message: `Only ${avail} gift${avail === 1 ? '' : 's'} can be shown at ${BUDGETS[t].label} (minimum ${minTier}).`,
        tip: t === 'u100'
          ? `Add small gifts priced AED ${BUDGETS[t].max - WRAP_COST} or less. Under-100 buyers are the quickest to say yes.`
          : `Add gifts priced up to AED ${BUDGETS[t].max - WRAP_COST} that are not gated to a higher tier.`,
      });
    }
    if (byPriceBand[t] === 0) {
      const lo = BUDGET_ORDER.indexOf(t) === 0 ? 0 : BUDGETS[BUDGET_ORDER[BUDGET_ORDER.indexOf(t) - 1]].max - WRAP_COST + 1;
      const hi = BUDGETS[t].max - WRAP_COST;
      add({
        severity: 'warning', scope: 'tier', key: t,
        message: `No gift is priced in the ${BUDGETS[t].label} band (AED ${lo}${t === '500+' ? '+' : `–${hi}`}).`,
        tip: t === '500+'
          ? 'Boxes for this budget are built from several smaller gifts. Add a premium hero gift (AED 350+) so they feel special.'
          : 'Boxes in this budget will be made of cheaper items and look under-spent. Add a gift priced in this band.',
      });
    }
  }

  for (const g of overpriced) {
    add({
      severity: 'warning', scope: 'tier', key: g.id,
      message: `"${g.name}" (AED ${g.price}) is too expensive for any budget, so it will never be shown.`,
      tip: `The highest budget fits gifts up to AED ${BUDGETS['500+'].max - WRAP_COST}. Lower the price or split it into a smaller offer.`,
    });
  }
  if (uncategorised.length) {
    add({
      severity: 'info', scope: 'overall',
      message: `${uncategorised.length} item${uncategorised.length === 1 ? ' has' : 's have'} no category, so they are not counted per category.`,
      tip: 'Give every product a category.',
    });
  }

  alerts.sort((a, b) => RANK[b.severity] - RANK[a.severity]);
  return {
    total: gifts.length, byCategory, byInterest, byPriceBand, availableByTier, matrix, alerts,
    ok: !alerts.some((a) => RANK[a.severity] >= RANK.warning),
  };
}

export class CoverageError extends Error {
  constructor(public report: CoverageReport, public failOn: Severity) {
    const hits = report.alerts.filter((a) => RANK[a.severity] >= RANK[failOn]);
    super(`Catalogue coverage check failed (${hits.length} issue${hits.length === 1 ? '' : 's'}):\n${hits.map((a) => `- ${a.message}`).join('\n')}`);
    this.name = 'CoverageError';
  }
}

/** Throws a CoverageError when any alert is at or above `failOn` (default: warning, so zero items and below-minimum both fail). */
export function assertCoverage(catalog: CatalogItem[], opts: CoverageOptions & { failOn?: Severity } = {}): CoverageReport {
  const failOn = opts.failOn ?? 'warning';
  const report = auditCatalog(catalog, opts);
  if (report.alerts.some((a) => RANK[a.severity] >= RANK[failOn])) throw new CoverageError(report, failOn);
  return report;
}

/** Terminal-friendly dashboard: counts per category and price band, then alerts with tips. */
export function formatCoverage(r: CoverageReport): string {
  const pad = (s: string | number, n: number) => String(s).padStart(n);
  const lines: string[] = [];
  lines.push(`CATALOGUE COVERAGE · ${r.total} gifts`, '');
  lines.push(`${'Category'.padEnd(26)}${pad('Total', 6)}${BUDGET_ORDER.map((t) => pad(t === 'u100' ? '<100' : t, 9)).join('')}`);
  for (const c of CATEGORY_IDS) {
    const flag = r.byCategory[c] === 0 ? '  <- EMPTY' : '';
    lines.push(`${CATEGORIES[c].label.padEnd(26)}${pad(r.byCategory[c], 6)}${BUDGET_ORDER.map((t) => pad(r.matrix[c][t], 9)).join('')}${flag}`);
  }
  lines.push(`${'In each price band'.padEnd(26)}${pad(r.total, 6)}${BUDGET_ORDER.map((t) => pad(r.byPriceBand[t], 9)).join('')}`);
  lines.push(`${'Usable at each budget'.padEnd(26)}${pad('', 6)}${BUDGET_ORDER.map((t) => pad(r.availableByTier[t], 9)).join('')}`);
  lines.push('', 'Buyer interests (items that match each):');
  lines.push(INTERESTS.map((i) => `${INTEREST_WORDS[i].label} ${r.byInterest[i]}`).join(' · '));
  lines.push('');
  if (!r.alerts.length) lines.push('No gaps found.');
  for (const a of r.alerts) lines.push(`${a.severity.toUpperCase().padEnd(9)}${a.message}\n         Tip: ${a.tip}`);
  return lines.join('\n');
}

/** Short, general advice for the admin screen and import report. Alerts above give the specific version. */
export const ONBOARDING_TIPS: string[] = [
  'Stock every category. Buyers pick interests first; an empty category means some buyers get no relevant gift.',
  'Give each category at least 2 items, and 3 or more for the ones buyers pick most.',
  'Mix price points inside each category: a small treat under AED 85, a mid-range gift around AED 100–180, and one premium piece.',
  'Keep plenty under AED 85. Those are the only gifts that can appear for "Under AED 100" buyers.',
  'Add one or two hero gifts at AED 350 or more. Big-budget boxes fill up with them first.',
  'Use tags the generator knows (candle, cake, birthday, eid, luxury, custom) so rules are set for you. Use "custom" or "personalised" for made-to-order pieces; they only appear at the "Personal" levels.',
  'Add occasion tags to cakes and sweets (birthday, celebration, eid). They get a boost when the buyer picks a matching occasion.',
  'Keep titles under 60 characters and blurbs under 140. A clean photo on a plain background works best.',
  'Run the coverage check after every upload and fix the critical alerts first.',
];
