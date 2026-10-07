import { BUDGET_ORDER, BUDGETS, earliestTier } from '../../engine/budgets';
import { auditCatalog, type CoverageAlert } from '../../engine/coverage';
import type { Product } from '../../engine/product';
import { LIMITS } from '../../engine/product';
import { CATEGORIES, compileProduct, generateRules } from '../../engine/rules';
import type { BudgetId, CatalogItem, CategoryId, HeartLevel, Interest, Occasion, Relationship, Vibe } from '../../engine/types';

/** What the add/edit form holds. Empty override lists mean "work it out automatically". */
export interface FormState {
  title: string;
  price: string;
  category: CategoryId | '';
  imageUrl: string;
  tags: string[];
  blurb: string;
  interests: Interest[];
  vibes: Vibe[];
  occasions: Occasion[];
  recipients: Relationship[];
  minBudget: BudgetId | '';
  hearts: '' | '1' | '2' | '3';
  photo: boolean;
  active: boolean;
}

export const emptyForm = (): FormState => ({
  title: '', price: '', category: '', imageUrl: '', tags: [], blurb: '', interests: [], vibes: [], occasions: [],
  recipients: [], minBudget: '', hearts: '', photo: false, active: true,
});

export function fromProduct(p: Product): FormState {
  return {
    title: p.title, price: String(p.price), category: p.category, imageUrl: p.imageUrl ?? '', tags: [...(p.tags ?? [])], blurb: p.blurb,
    interests: [...(p.interests ?? [])], vibes: [...(p.vibes ?? [])], occasions: [...(p.occasions ?? [])], recipients: [...(p.recipients ?? [])],
    minBudget: p.minBudget ?? '', hearts: p.unlock?.hearts ? (String(p.unlock.hearts) as FormState['hearts']) : '', photo: !!p.unlock?.photo,
    active: p.active !== false,
  };
}

/** The raw object handed to the same validator the CSV/JSON import uses, so there is one set of rules. */
export function toRaw(f: FormState, id?: string): Record<string, unknown> {
  return {
    id: id || undefined,
    title: f.title,
    blurb: f.blurb,
    price: f.price,
    category: f.category,
    imageUrl: f.imageUrl.trim() || undefined,
    tags: f.tags,
    interests: f.interests,
    vibes: f.vibes,
    occasions: f.occasions,
    recipients: f.recipients,
    minBudget: f.minBudget || undefined,
    unlock: { hearts: f.hearts || undefined, photo: f.photo || undefined },
    active: f.active,
  };
}

/** Form field to the column name the validator reports it under. */
export const ISSUE_FIELD: Record<string, string> = {
  title: 'title', price: 'price', category: 'category', imageUrl: 'image_url', blurb: 'blurb', interests: 'interests', vibes: 'vibes',
  occasions: 'occasions', recipients: 'recipients', minBudget: 'min_budget', hearts: 'unlock_hearts', photo: 'unlock_photo', id: 'id',
};

const parsePrice = (s: string) => Number(s.replace(/aed|,|\s/gi, ''));

/** A best-effort Product for the live preview: works while the form is still half filled in. Null until a category is chosen. */
export function previewProduct(f: FormState): Product | null {
  if (!f.category) return null;
  const price = parsePrice(f.price);
  const p: Product = {
    id: 'preview',
    title: f.title.trim() || 'Your product',
    blurb: f.blurb.trim() || 'A thoughtful gift, chosen with care.',
    price: Number.isFinite(price) && price > 0 ? price : 0,
    category: f.category,
    tags: f.tags,
  };
  if (f.imageUrl.trim()) p.imageUrl = f.imageUrl.trim();
  if (f.interests.length) p.interests = f.interests;
  if (f.vibes.length) p.vibes = f.vibes;
  if (f.occasions.length) p.occasions = f.occasions;
  if (f.recipients.length) p.recipients = f.recipients;
  if (f.minBudget) p.minBudget = f.minBudget;
  if (f.hearts || f.photo) p.unlock = { ...(f.hearts && { hearts: Number(f.hearts) as HeartLevel }), ...(f.photo && { photo: true }) };
  return p;
}

export interface TriggerPreview {
  item: CatalogItem;
  rows: { label: string; weight?: string; values: string[]; auto: boolean; empty?: string }[];
  budget: string;
  warnings: string[];
}

const LEVEL = ['', 'Thoughtful and up', 'Personal and up', '"Made for Them" only'];

/** The auto-generated trigger rules, laid out for the preview panel. */
export function triggerPreview(f: FormState, labels: { interest: (i: Interest) => string; vibe: (v: Vibe) => string; occasion: (o: Occasion) => string; relation: (r: Relationship) => string }): TriggerPreview | null {
  const p = previewProduct(f);
  if (!p) return null;
  const rules = generateRules(p);
  const item = compileProduct(p);
  const tier = earliestTier(item.price);
  const floor = f.minBudget && (!tier || BUDGET_ORDER.indexOf(f.minBudget) > BUDGET_ORDER.indexOf(tier)) ? f.minBudget : tier;
  const budget = !p.price ? 'Enter a price to see this' : !floor ? `AED ${item.price} is too high for any budget` : floor === 'u100' ? 'Every budget' : `From ${BUDGETS[floor].label} and above`;
  return {
    item,
    budget,
    warnings: rules.warnings,
    rows: [
      { label: 'Matches interests', weight: '+3 each', values: rules.interests.map(labels.interest), auto: !f.interests.length, empty: 'None' },
      { label: 'Suits vibes', weight: '+2 each', values: rules.vibes.map(labels.vibe), auto: !f.vibes.length, empty: 'None' },
      { label: 'Occasion boost', weight: '+1', values: rules.occasions.map(labels.occasion), auto: !f.occasions.length, empty: 'No boost' },
      { label: 'Offered for', values: rules.recipients.map(labels.relation), auto: !f.recipients.length, empty: 'Everyone' },
      {
        label: 'Unlocked at',
        values: [rules.minHearts ? LEVEL[rules.minHearts] : 'Any personalisation level', ...(rules.needsPhoto ? ['Needs an uploaded photo'] : [])],
        auto: !f.hearts && !f.photo,
      },
    ],
  };
}

export interface Impact {
  category: { label: string; before: number; after: number };
  /** Alerts this product clears completely. */
  fixes: string[];
  /** Alerts it makes less serious but does not clear yet (for example "No Cakes" becoming "Only 1 Cakes item"). */
  improved: string[];
  newIssues: string[];
}

const RANK = { info: 0, warning: 1, critical: 2 } as const;
const keyOf = (a: CoverageAlert) => `${a.scope}:${a.key ?? ''}`;
const serious = (a: CoverageAlert) => a.severity !== 'info';

/** What saving this product does to the coverage report: category count and which alerts it fixes, eases or creates. */
export function coverageImpact(catalog: CatalogItem[], id: string, item: CatalogItem): Impact | null {
  if (!item.category || !item.price) return null;
  const base = catalog.filter((i) => i.id !== id);
  const before = auditCatalog(base);
  const after = auditCatalog([...base, { ...item, id }]);
  const was = new Map(before.alerts.filter(serious).map((a) => [keyOf(a), a]));
  const now = new Map(after.alerts.filter(serious).map((a) => [keyOf(a), a]));
  return {
    category: { label: CATEGORIES[item.category].label, before: before.byCategory[item.category], after: after.byCategory[item.category] },
    fixes: [...was].filter(([k]) => !now.has(k)).map(([, a]) => a.message),
    improved: [...now].filter(([k, a]) => was.has(k) && RANK[a.severity] < RANK[was.get(k)!.severity]).map(([, a]) => a.message),
    newIssues: [...now].filter(([k]) => !was.has(k)).map(([, a]) => a.message),
  };
}

export { LIMITS };
