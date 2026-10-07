import { BUDGETS, earliestTier } from './budgets';
import { LIMITS, type Product } from './product';
import { INTEREST_WORDS, OCCASION_WORDS, RELATION_WORDS, VIBE_WORDS } from './words';
import type { CatalogItem, CategoryId, HeartLevel, Interest, Occasion, Relationship, Vibe } from './types';

/* =====================================================================
   Trigger rule generator
   ---------------------------------------------------------------------
   The scoring engine (engine.ts) is unchanged and scores every item as
     +3 per matching interest, +2 per matching vibe, +1 occasion boost,
     (+1.5 x heart level for personalised items),
   so "assigning weights" means choosing WHICH interests, vibes and
   occasions an item carries. This file does that from the product's
   category and tags. Anything the admin sets explicitly replaces what
   is generated.
   ===================================================================== */

export interface CategoryDef {
  label: string;
  /** Icon key (components/Icon) and swatch colour used when a product has no photo. */
  icon: string;
  tone: string;
  /** Defaults every product in this category starts from. */
  interests: Interest[];
  vibes: Vibe[];
  occasions?: Occasion[];
  minHearts?: HeartLevel;
  /** What the admin screen can show next to the category picker. */
  hint: string;
}

export const CATEGORIES: Record<CategoryId, CategoryDef> = {
  coffee: { label: 'Coffee', icon: 'coffee', tone: '#8a5a3c', interests: ['coffee'], vibes: ['cozy', 'natural'], hint: 'Beans, mugs, brewing gear' },
  selfcare: { label: 'Self-care', icon: 'bath', tone: '#e3b9a6', interests: ['selfcare'], vibes: ['cozy', 'natural'], hint: 'Bath, body and skin' },
  flowers: { label: 'Flowers', icon: 'flower', tone: '#e7a3a8', interests: ['flowers'], vibes: ['romantic', 'joyful'], hint: 'Bouquets, dried and preserved flowers' },
  beauty: { label: 'Beauty', icon: 'spray', tone: '#c7a98f', interests: ['beauty'], vibes: ['elegant', 'joyful'], hint: 'Makeup, fragrance, jewellery' },
  wellness: { label: 'Wellness', icon: 'leaf', tone: '#a8b98e', interests: ['wellness'], vibes: ['natural', 'minimal'], hint: 'Tea, fitness, calm' },
  home: { label: 'Home & calm evenings', icon: 'sofa', tone: '#cdb6a2', interests: ['home'], vibes: ['cozy', 'minimal'], hint: 'Décor, throws, lighting' },
  books: { label: 'Books', icon: 'book', tone: '#9c8169', interests: ['books'], vibes: ['cozy', 'minimal'], hint: 'Books, stationery, reading' },
  treats: { label: 'Sweet treats', icon: 'candy', tone: '#7b4b3a', interests: ['treats'], vibes: ['joyful', 'elegant'], hint: 'Chocolates, dates, boxes' },
  tech: { label: 'Tech & gadgets', icon: 'phone', tone: '#8b7b6b', interests: ['tech'], vibes: ['minimal', 'joyful'], hint: 'Gadgets and accessories' },
  travel: { label: 'Travel', icon: 'plane', tone: '#a07b5c', interests: ['travel'], vibes: ['minimal', 'elegant'], hint: 'Bags, passports, maps' },
  candles: { label: 'Candles', icon: 'flame', tone: '#e2c095', interests: ['home', 'selfcare'], vibes: ['cozy', 'romantic'], hint: 'Scented, soy and custom candles' },
  cakes: { label: 'Cakes', icon: 'cake', tone: '#e9b2bd', interests: ['treats'], vibes: ['joyful', 'elegant'], occasions: ['birthday', 'celebration', 'anniversary'], hint: 'Cakes, cupcakes, dessert boxes' },
  sweets: { label: 'Sweets', icon: 'cookie', tone: '#c08f5c', interests: ['treats'], vibes: ['joyful', 'cozy'], occasions: ['thankyou', 'celebration'], hint: 'Cookies, mithai, chocolates, baklava' },
  experiences: { label: 'Experiences & vouchers', icon: 'sparkles', tone: '#caa59a', interests: [], vibes: ['joyful', 'elegant'], hint: 'Classes, spa, dining. Add an interest or tag so it can match.' },
  personalised: { label: 'Personalised', icon: 'heart', tone: '#d98b8b', interests: [], vibes: ['romantic', 'cozy'], minHearts: 2, hint: 'Made for one person. Needs the "Personal" level.' },
};

export interface TagRule {
  interests?: Interest[];
  vibes?: Vibe[];
  occasions?: Occasion[];
  recipients?: Relationship[];
  hearts?: HeartLevel;
  photo?: boolean;
}

/** Group synonyms under one rule. */
function group(rows: [string[], TagRule][]): Record<string, TagRule> {
  const out: Record<string, TagRule> = {};
  for (const [names, rule] of rows) for (const n of names) out[n] = rule;
  return out;
}

/** Known tags. Unknown tags are fine: they are kept on the product but add no rules. */
export const TAG_RULES: Record<string, TagRule> = group([
  // what it is
  [['candle', 'candles', 'scented', 'soy-wax', 'wax'], { interests: ['home', 'selfcare'], vibes: ['cozy', 'romantic'] }],
  [['cake', 'cakes', 'cupcake', 'cupcakes', 'bakery'], { interests: ['treats'], vibes: ['joyful', 'elegant'], occasions: ['birthday', 'celebration'] }],
  [['dessert', 'sweets', 'sweet', 'chocolate', 'macaron', 'macarons', 'cookie', 'cookies', 'mithai', 'baklava'], { interests: ['treats'], vibes: ['joyful'] }],
  [['flowers', 'bouquet', 'florist'], { interests: ['flowers'], vibes: ['romantic', 'joyful'] }],
  [['coffee', 'espresso'], { interests: ['coffee'], vibes: ['cozy'] }],
  [['skincare', 'bath', 'spa'], { interests: ['selfcare'] }],
  [['fragrance', 'perfume', 'oud', 'makeup', 'jewellery', 'jewelry'], { interests: ['beauty'], vibes: ['elegant'] }],
  [['tea', 'herbal', 'yoga', 'plant'], { interests: ['wellness'], vibes: ['natural'] }],
  [['book', 'books', 'novel', 'journal', 'stationery'], { interests: ['books'] }],
  [['gadget', 'gadgets', 'tech', 'headphones'], { interests: ['tech'] }],
  [['travel', 'luggage', 'passport'], { interests: ['travel'] }],
  [['decor', 'home', 'throw', 'lamp'], { interests: ['home'] }],

  // when
  [['birthday'], { occasions: ['birthday'] }],
  [['anniversary'], { occasions: ['anniversary'], vibes: ['romantic'] }],
  [['wedding'], { occasions: ['celebration', 'anniversary'] }],
  [['thank-you', 'thanks', 'thankyou'], { occasions: ['thankyou'] }],
  [['housewarming', 'new-home', 'new-baby', 'baby', 'graduation'], { occasions: ['newbeginning'] }],
  [['celebration', 'party'], { occasions: ['celebration'] }],
  [['eid', 'ramadan', 'iftar'], { occasions: ['celebration', 'thankyou'] }],
  [['valentine', 'valentines'], { occasions: ['anniversary', 'justbecause'], vibes: ['romantic'] }],
  [['mothers-day', 'fathers-day'], { occasions: ['thankyou'] }],
  [['just-because'], { occasions: ['justbecause'] }],

  // feel
  [['romantic', 'love'], { vibes: ['romantic'] }],
  [['luxury', 'premium', 'elegant'], { vibes: ['elegant'] }],
  [['minimal', 'modern'], { vibes: ['minimal'] }],
  [['natural', 'organic', 'vegan', 'eco', 'handmade'], { vibes: ['natural'] }],
  [['cozy', 'cosy', 'warm'], { vibes: ['cozy'] }],
  [['fun', 'playful', 'colourful', 'colorful'], { vibes: ['joyful'] }],

  // who it is for
  [['couple', 'for-two', 'date-night'], { recipients: ['partner'] }],
  [['corporate', 'office', 'team'], { recipients: ['colleague'] }],
  [['kids', 'children'], { recipients: ['family'] }],

  // how personal it is
  [['custom', 'personalised', 'personalized', 'monogram', 'engraved', 'initials', 'name', 'message'], { hearts: 2 }],
  [['bespoke', 'made-to-order', 'made-for-them'], { hearts: 3 }],
  [['photo', 'photo-print', 'portrait'], { photo: true, hearts: 2 }],
]);

export function normaliseTag(t: string): string {
  return t.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function normaliseTags(tags: readonly string[] | undefined): string[] {
  return [...new Set((tags ?? []).map(normaliseTag).filter(Boolean))];
}

const uniq = <T,>(xs: T[]): T[] => [...new Set(xs)];

export interface GeneratedRules {
  interests: Interest[];
  vibes: Vibe[];
  occasions: Occasion[];
  recipients: Relationship[];
  minHearts?: HeartLevel;
  needsPhoto: boolean;
  /** Plain-English notes for the admin screen or import report. */
  warnings: string[];
}

type RuleInput = Pick<Product, 'category' | 'tags' | 'interests' | 'vibes' | 'occasions' | 'recipients' | 'unlock'>;

/** Category first, then tags in the order given, capped at the engine's usual sizes. Explicit fields replace generated ones. */
export function generateRules(p: RuleInput): GeneratedRules {
  const cat = CATEGORIES[p.category];
  const fromTags = normaliseTags(p.tags).map((t) => TAG_RULES[t]).filter((r): r is TagRule => !!r);
  // Interests and vibes start from the category (its identity). Occasions start from the tags: what
  // someone typed for this product ("eid", "birthday") is more specific than a category default.
  const collect = <K extends 'interests' | 'vibes' | 'occasions' | 'recipients'>(key: K, base: TagRule[K] | undefined, tagsFirst = false) => {
    const fromTag = fromTags.flatMap((r) => r[key] ?? []);
    return uniq(tagsFirst ? [...fromTag, ...(base ?? [])] : [...(base ?? []), ...fromTag]) as NonNullable<TagRule[K]>;
  };

  const interests = (p.interests?.length ? p.interests : collect('interests', cat.interests)).slice(0, LIMITS.interests);
  const vibes = (p.vibes?.length ? p.vibes : collect('vibes', cat.vibes)).slice(0, LIMITS.vibes);
  const occasions = (p.occasions?.length ? p.occasions : collect('occasions', cat.occasions, true)).slice(0, LIMITS.occasions);
  const recipients = p.recipients?.length ? p.recipients : collect('recipients', undefined);

  let hearts: HeartLevel | undefined =
    p.unlock?.hearts ?? (Math.max(cat.minHearts ?? 0, ...fromTags.map((r) => r.hearts ?? 0)) || undefined) as HeartLevel | undefined;
  const needsPhoto = p.unlock?.photo ?? fromTags.some((r) => r.photo);
  // A photo item is always a personal one (same as the built-in photo gifts).
  if (needsPhoto && (hearts ?? 0) < 2) hearts = 2;

  const warnings: string[] = [];
  if (!interests.length && !hearts) {
    warnings.push('No interest matched, so this item is scored down. Add an interest, a tag such as "coffee" or "books", or a "Personal" unlock.');
  }
  if (!vibes.length) warnings.push('No vibe set, so it will not get vibe points. Add a vibe or a tag such as "cozy" or "luxury".');
  return { interests, vibes, occasions, recipients, minHearts: hearts, needsPhoto, warnings };
}

/** Product to the CatalogItem the scoring engine reads. Inactive products are the caller's concern (see mergeCatalog). */
export function compileProduct(p: Product): CatalogItem {
  const r = generateRules(p);
  const cat = CATEGORIES[p.category];
  const tags = normaliseTags(p.tags);
  const item: CatalogItem = {
    id: p.id,
    category: p.category,
    name: p.title,
    blurb: p.blurb,
    price: Math.round(p.price),
    icon: cat.icon,
    tone: cat.tone,
    interests: r.interests,
    vibes: r.vibes,
  };
  if (p.imageUrl) item.imageUrl = p.imageUrl;
  if (tags.length) item.tags = tags;
  if (r.occasions.length) item.occasions = r.occasions;
  if (r.recipients.length) item.relationships = r.recipients;
  if (r.minHearts) item.minHearts = r.minHearts;
  if (r.needsPhoto) item.needsPhoto = true;
  if (p.minBudget) item.minBudget = p.minBudget;
  return item;
}

/** A readable explanation of when the engine will pick an item (for the admin screen and sourcing lists). */
export function describeTrigger(i: CatalogItem): string {
  const parts: string[] = [];
  if (i.interests.length) parts.push(`Interest match: ${i.interests.map((x) => INTEREST_WORDS[x].label).join(' / ')} (+3 each).`);
  else parts.push('No interest tag; chosen by personalisation level and vibe only.');
  if (i.vibes.length) parts.push(`Vibe match: ${i.vibes.map((x) => VIBE_WORDS[x].label).join(' / ')} (+2 each).`);
  if (i.occasions?.length) parts.push(`Occasion boost (+1): ${i.occasions.map((x) => OCCASION_WORDS[x].label).join(', ')}.`);
  if (i.relationships?.length) parts.push(`Only offered when the gift is for: ${i.relationships.map((x) => RELATION_WORDS[x].label).join(', ')}.`);
  if (i.minHearts) parts.push(`Unlocks at personalisation level ${i.minHearts}+.`);
  if (i.needsPhoto) parts.push('Only offered if the buyer uploaded a photo.');
  if (i.vibes.includes('romantic')) parts.push('Pushed down for colleagues (romantic vibe).');
  const tier = earliestTier(i.price);
  const floor = i.minBudget && (!tier || BUDGETS[i.minBudget].max > BUDGETS[tier].max) ? i.minBudget : tier;
  parts.push(floor ? `Earliest budget tier: ${BUDGETS[floor].label} (price AED ${i.price}).` : `Price AED ${i.price} fits no budget tier.`);
  return parts.join(' ');
}

/** Turn a built-in gift back into an editable Product (its current rules become explicit settings). */
export function productFromItem(i: CatalogItem): Product {
  const p: Product = { id: i.id, title: i.name, blurb: i.blurb, price: i.price, category: i.category ?? 'home' };
  if (i.imageUrl) p.imageUrl = i.imageUrl;
  if (i.tags?.length) p.tags = [...i.tags];
  if (i.interests.length) p.interests = [...i.interests];
  if (i.vibes.length) p.vibes = [...i.vibes];
  if (i.occasions?.length) p.occasions = [...i.occasions];
  if (i.relationships?.length) p.recipients = [...i.relationships];
  if (i.minBudget) p.minBudget = i.minBudget;
  if (i.minHearts || i.needsPhoto) p.unlock = { ...(i.minHearts && { hearts: i.minHearts }), ...(i.needsPhoto && { photo: true }) };
  return p;
}
