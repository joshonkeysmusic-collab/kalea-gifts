import { SEED_CATALOG, setCustomProducts } from '../engine/catalog';
import { productsFromJson } from '../engine/ingest';
import type { Product } from '../engine/product';
import { productFromItem } from '../engine/rules';

/**
 * Admin products, in two layers:
 *   published = what /catalog.custom.json shipped with the app (read-only here)
 *   drafts    = what Katya has added or changed in the admin panel, kept in this browser
 * Drafts win over published, and both win over the built-in gifts. Every change is applied to the
 * engine straight away, so she can test recommendations on this device before publishing.
 */
const KEY = 'kalea_catalog_drafts_v1';

let published: Product[] = [];
let drafts: Product[] = [];
let version = 0;
const listeners = new Set<() => void>();

function readDrafts(): Product[] {
  try {
    const text = localStorage.getItem(KEY);
    return text ? productsFromJson(text).products : [];
  } catch {
    return [];
  }
}

function writeDrafts() {
  try {
    if (drafts.length) localStorage.setItem(KEY, JSON.stringify(drafts));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage full or blocked: drafts live for this session only */
  }
}

/** Later lists win by id; order follows first appearance. */
export function mergeProducts(...lists: Product[][]): Product[] {
  const byId = new Map<string, Product>();
  for (const list of lists) for (const p of list) byId.set(p.id, p);
  return [...byId.values()];
}

function apply() {
  setCustomProducts(mergeProducts(published, drafts));
  version++;
  listeners.forEach((fn) => fn());
}

/** Called once at start-up with the products from catalog.custom.json. */
export function initCatalog(file: Product[]): void {
  published = file;
  drafts = readDrafts();
  apply();
}

export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
export const getVersion = () => version;

export const getPublished = () => published;
export const getDrafts = () => drafts;
/** Everything that would go into catalog.custom.json if Katya published now. */
export const getAllProducts = () => mergeProducts(published, drafts);

const builtinIds = new Set(SEED_CATALOG.map((i) => i.id));
export type Source = 'draft' | 'published' | 'builtin';

export function sourceOf(id: string): Source {
  if (drafts.some((p) => p.id === id)) return 'draft';
  if (published.some((p) => p.id === id)) return 'published';
  return 'builtin';
}
export const isBuiltinId = (id: string) => builtinIds.has(id);

export function saveDraft(p: Product): void {
  drafts = mergeProducts(drafts, [p]);
  writeDrafts();
  apply();
}

export function addDrafts(list: Product[]): void {
  drafts = mergeProducts(drafts, list);
  writeDrafts();
  apply();
}

export function removeDraft(id: string): void {
  drafts = drafts.filter((p) => p.id !== id);
  writeDrafts();
  apply();
}

export function clearDrafts(): void {
  drafts = [];
  writeDrafts();
  apply();
}

/** Hide a gift (built-in or published) without deleting it. */
export function hideProduct(p: Product): void {
  saveDraft({ ...p, active: false });
}

/**
 * Undo hide. If something visible sits underneath the draft (a built-in gift, or a published product),
 * dropping the draft reveals it; otherwise the product is switched back on.
 */
export function restoreProduct(p: Product): void {
  const base = published.find((x) => x.id === p.id);
  const underneathVisible = base ? base.active !== false : builtinIds.has(p.id);
  if (underneathVisible) return removeDraft(p.id);
  const { active, ...rest } = p;
  void active;
  saveDraft(rest);
}

export { productFromItem };
