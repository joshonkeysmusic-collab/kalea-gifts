import { BUDGET_ORDER } from './budgets';
import {
  CATEGORY_IDS,
  HEART_LEVELS,
  INTERESTS,
  LIMITS,
  OCCASIONS,
  RELATIONSHIPS,
  VIBES,
  type CategoryId,
  type Product,
} from './product';
import { generateRules } from './rules';
import type { BudgetId, HeartLevel } from './types';

/* =====================================================================
   Admin ingestion: CSV or JSON in, validated Product[] out.
   Nothing here throws on bad data. Problems come back as issues that
   name the row and the column, so they can be fixed in the spreadsheet.
   ===================================================================== */

export interface IngestIssue {
  /** CSV: spreadsheet row (the header is row 1). JSON: position in the list, starting at 1. */
  row: number;
  level: 'error' | 'warning';
  field?: string;
  message: string;
}

export interface IngestResult {
  /** Rows that passed. Rows with errors are left out. */
  products: Product[];
  issues: IngestIssue[];
  /** True when no row had an error (warnings are fine). */
  ok: boolean;
}

export interface IngestOptions {
  /** Ids already in the catalogue; a product with one of them replaces it, and a warning says so. */
  existingIds?: Iterable<string>;
}

export const CSV_COLUMNS = [
  'id', 'title', 'blurb', 'price', 'category', 'image_url', 'tags', 'interests', 'vibes', 'occasions',
  'recipients', 'min_budget', 'unlock_hearts', 'unlock_photo', 'active',
] as const;

const RESERVED_IDS = new Set(['wrap', 'card']);
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

/* ---------- CSV ---------- */

/** Minimal RFC 4180 parser: quoted cells, doubled quotes, newlines inside quotes. Blank lines are kept so row numbers match the sheet. */
export function parseCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, '');
  const head = s.split(/\r?\n/, 1)[0] ?? '';
  const count = (c: string) => head.split(c).length - 1;
  const delim = count(',') >= count(';') && count(',') >= count('\t') ? ',' : count(';') >= count('\t') ? ';' : '\t';
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cur); cur = ''; rows.push(row); row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export function productsFromCsv(text: string, opts: IngestOptions = {}): IngestResult {
  const rows = parseCsv(text);
  const header = rows[0];
  if (!header || header.every((h) => !h.trim())) {
    return { products: [], ok: false, issues: [{ row: 1, level: 'error', message: 'The file is empty. Use the first row for column names (see products.template.csv).' }] };
  }
  const keys = header.map((h) => h.trim());
  const raws: { row: number; raw: Record<string, unknown> }[] = [];
  rows.slice(1).forEach((cells, i) => {
    if (cells.every((c) => c.trim() === '') || cells[0]?.trim().startsWith('#')) return;
    const raw: Record<string, unknown> = {};
    keys.forEach((k, j) => { if (k) raw[k] = cells[j] ?? ''; });
    raws.push({ row: i + 2, raw });
  });
  return validate(raws, opts, keys);
}

/* ---------- JSON ---------- */

/** Accepts [ {...}, ... ] or { "products": [ {...}, ... ] }. */
export function productsFromJson(text: string, opts: IngestOptions = {}): IngestResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { products: [], ok: false, issues: [{ row: 1, level: 'error', message: `Not valid JSON: ${(e as Error).message}` }] };
  }
  const list = Array.isArray(data) ? data : (data as { products?: unknown })?.products;
  if (!Array.isArray(list)) {
    return { products: [], ok: false, issues: [{ row: 1, level: 'error', message: 'Expected a list of products, or an object with a "products" list.' }] };
  }
  const raws = list.map((raw, i) => ({ row: i + 1, raw: (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown> }));
  return validate(raws, opts);
}

/* ---------- validation ---------- */

const FIELD_OF: Record<string, string> = {
  id: 'id', title: 'title', name: 'title', blurb: 'blurb', description: 'blurb', price: 'price', category: 'category',
  imageurl: 'imageUrl', image: 'imageUrl', tags: 'tags', interests: 'interests', vibes: 'vibes', occasions: 'occasions',
  recipients: 'recipients', minbudget: 'minBudget', unlockhearts: 'unlockHearts', unlockphoto: 'unlockPhoto',
  unlock: 'unlock', active: 'active',
};

/** Lowercase letters and digits only, so "Self-care", "self care" and "selfcare" all match. */
const canon = (s: string) => s.toLowerCase().replace(/aed/g, '').replace(/[^a-z0-9]/g, '');

const ALIASES = {
  interest: { sweettreats: 'treats', homecalmevenings: 'home', calmevenings: 'home', techgadgets: 'tech', gadgets: 'tech' },
  category: {
    candle: 'candles', cake: 'cakes', sweet: 'sweets', experience: 'experiences', voucher: 'experiences', vouchers: 'experiences',
    personalized: 'personalised', custom: 'personalised', homecalmevenings: 'home', sweettreats: 'treats', techgadgets: 'tech',
    selfcare: 'selfcare', experiencesvouchers: 'experiences',
  },
  budget: { under100: 'u100', '100200': '100-200', '200300': '200-300', '300500': '300-500', '500': '500+', '500plus': '500+' },
} as const;

export function slugify(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
}

/** A slug not already in `taken`: rose-candle, rose-candle-2, rose-candle-3 ... */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || 'product';
  let id = root;
  for (let n = 2; used.has(id) || RESERVED_IDS.has(id); n++) id = `${root}-${n}`;
  return id;
}

const str = (v: unknown) => (v == null ? '' : String(v).trim());
const toList = (v: unknown): string[] =>
  (Array.isArray(v) ? v.map(str) : str(v).split(/[|,;]/).map((x) => x.trim())).filter(Boolean);
const yes = (v: unknown) => v === true || /^(1|y|yes|true|x)$/i.test(str(v));
const no = (v: unknown) => v === false || /^(0|n|no|false)$/i.test(str(v));

function validate(raws: { row: number; raw: Record<string, unknown> }[], opts: IngestOptions, csvHeader?: string[]): IngestResult {
  const issues: IngestIssue[] = [];
  const products: Product[] = [];
  const existing = new Set(opts.existingIds ?? []);
  const seen = new Set<string>();
  const add = (row: number, level: IngestIssue['level'], message: string, field?: string) => issues.push({ row, level, field, message });

  if (csvHeader) {
    const unknown = csvHeader.filter((h) => h && !FIELD_OF[h.toLowerCase().replace(/[^a-z]/g, '')]);
    if (unknown.length) add(1, 'warning', `Ignoring unknown column${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}.`);
    if (!csvHeader.some((h) => FIELD_OF[h.toLowerCase().replace(/[^a-z]/g, '')] === 'title')) add(1, 'error', 'There is no "title" column.', 'title');
  }

  for (const { row, raw: original } of raws) {
    const raw: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(original)) {
      const f = FIELD_OF[k.toLowerCase().replace(/[^a-z]/g, '')];
      if (f) raw[f] = v;
      else if (!csvHeader) add(row, 'warning', `Ignoring unknown field "${k}".`, k);
    }
    const before = issues.filter((i) => i.level === 'error').length;
    const err = (field: string, message: string) => add(row, 'error', message, field);
    const warn = (field: string, message: string) => add(row, 'warning', message, field);

    // title
    const title = str(raw.title);
    if (!title) err('title', 'Title is required.');
    else if (title.length > LIMITS.title) err('title', `Title is ${title.length} characters; the limit is ${LIMITS.title}.`);

    // blurb
    let blurb = str(raw.blurb);
    if (!blurb) { warn('blurb', 'No blurb, so a generic line will be shown. Add one short sentence.'); blurb = 'A thoughtful gift, chosen with care.'; }
    else if (blurb.length > LIMITS.blurb) err('blurb', `Blurb is ${blurb.length} characters; the limit is ${LIMITS.blurb}.`);

    // price
    const priceText = str(raw.price).replace(/aed|,|\s/gi, '');
    const price = typeof raw.price === 'number' ? raw.price : Number(priceText);
    if (priceText === '' && typeof raw.price !== 'number') err('price', 'Price is required (whole AED, gift wrap not included).');
    else if (!Number.isFinite(price) || price <= 0) err('price', `"${str(raw.price)}" is not a valid price. Use a number such as 85.`);
    else if (price > LIMITS.price) err('price', `Price ${price} is above the limit of ${LIMITS.price}.`);
    else if (!Number.isInteger(price)) warn('price', `Price ${price} was rounded to ${Math.round(price)}; the app uses whole AED.`);

    // category
    const catKey = canon(str(raw.category));
    const category = (CATEGORY_IDS.find((c) => canon(c) === catKey) ?? (ALIASES.category as Record<string, CategoryId>)[catKey]) as CategoryId | undefined;
    if (!str(raw.category)) err('category', `Category is required. Choose one of: ${CATEGORY_IDS.join(', ')}.`);
    else if (!category) err('category', `Unknown category "${str(raw.category)}". Choose one of: ${CATEGORY_IDS.join(', ')}.`);

    // image
    const imageUrl = str(raw.imageUrl);
    if (imageUrl && !/^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/.test(imageUrl)) err('image_url', 'Image must be an https:// link or a site path starting with a single "/".');

    // enum lists
    const pickList = <T extends string>(field: string, label: string, allowed: readonly T[], extra: Record<string, string> = {}, max?: number): T[] | undefined => {
      const items = toList(raw[field]);
      if (!items.length) return undefined;
      const out: T[] = [];
      for (const it of items) {
        const key = canon(it);
        const hit = allowed.find((a) => canon(a) === key) ?? (extra[key] as T | undefined);
        if (hit) { if (!out.includes(hit)) out.push(hit); }
        else err(field, `Unknown ${label} "${it}". Choose from: ${allowed.join(', ')}.`);
      }
      if (max && out.length > max) { warn(field, `Only the first ${max} ${label}s are used.`); return out.slice(0, max); }
      return out;
    };
    const interests = pickList('interests', 'interest', INTERESTS, ALIASES.interest, LIMITS.interests);
    const vibes = pickList('vibes', 'vibe', VIBES, {}, LIMITS.vibes);
    const occasions = pickList('occasions', 'occasion', OCCASIONS, {}, LIMITS.occasions);
    const recipients = pickList('recipients', 'recipient', RELATIONSHIPS);

    // budget tier
    let minBudget: BudgetId | undefined;
    if (str(raw.minBudget)) {
      const key = canon(str(raw.minBudget));
      minBudget = BUDGET_ORDER.find((b) => canon(b) === key) ?? (ALIASES.budget as Record<string, BudgetId>)[key];
      if (!minBudget) err('min_budget', `Unknown budget tier "${str(raw.minBudget)}". Use one of: ${BUDGET_ORDER.join(', ')}.`);
    }

    // unlock
    const unlockObj = (raw.unlock && typeof raw.unlock === 'object' ? raw.unlock : {}) as { hearts?: unknown; photo?: unknown };
    const heartsRaw = raw.unlockHearts ?? unlockObj.hearts;
    let hearts: HeartLevel | undefined;
    if (str(heartsRaw)) {
      const word = canon(str(heartsRaw));
      const n = word === 'personal' ? 2 : word === 'madeforthem' ? 3 : word === 'thoughtful' ? 1 : Number(word);
      if ((HEART_LEVELS as number[]).includes(n)) hearts = n as HeartLevel;
      else err('unlock_hearts', `"${str(heartsRaw)}" is not a personalisation level. Use 1, 2 or 3 (or leave blank).`);
    }
    const photoRaw = raw.unlockPhoto ?? unlockObj.photo;
    const photo = yes(photoRaw) ? true : no(photoRaw) || str(photoRaw) === '' ? undefined : (err('unlock_photo', `"${str(photoRaw)}" is not yes or no.`), undefined);

    // active
    const activeRaw = raw.active;
    const active = no(activeRaw) ? false : undefined;

    // id
    let id = str(raw.id).toLowerCase();
    if (id) {
      if (!SLUG.test(id)) err('id', `Id "${id}" must be lowercase letters, digits and hyphens (for example rose-candle).`);
      else if (RESERVED_IDS.has(id)) err('id', `"${id}" is reserved for gift wrap and the card.`);
      else if (seen.has(id)) err('id', `Id "${id}" is used twice in this file.`);
    } else if (title) {
      const base = slugify(title) || 'product';
      id = base;
      for (let n = 2; seen.has(id) || RESERVED_IDS.has(id); n++) id = `${base}-${n}`;
    }

    if (issues.filter((i) => i.level === 'error').length > before || !category) continue;

    seen.add(id);
    if (existing.has(id)) warn('id', `Replaces the existing product "${id}".`);
    const product: Product = { id, title, blurb, price: Math.round(price), category };
    if (imageUrl) product.imageUrl = imageUrl;
    const tags = toList(raw.tags);
    if (tags.length) product.tags = tags;
    if (interests) product.interests = interests;
    if (vibes) product.vibes = vibes;
    if (occasions) product.occasions = occasions;
    if (recipients) product.recipients = recipients;
    if (minBudget) product.minBudget = minBudget;
    if (hearts || photo) product.unlock = { ...(hearts && { hearts }), ...(photo && { photo }) };
    if (active === false) product.active = false;

    // Surface what the generator could not fill in.
    for (const w of generateRules(product).warnings) warn('category', w);
    products.push(product);
  }

  return { products, issues, ok: !issues.some((i) => i.level === 'error') };
}

/** Human-readable report for a terminal or an admin screen. */
export function formatIssues(issues: IngestIssue[], where = 'row'): string {
  return issues
    .map((i) => `${i.level === 'error' ? 'ERROR  ' : 'warning'} ${where} ${i.row}${i.field ? ` · ${i.field}` : ''}: ${i.message}`)
    .join('\n');
}
