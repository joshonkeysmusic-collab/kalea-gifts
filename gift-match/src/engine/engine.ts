import { BUDGETS, BUDGET_ORDER } from './budgets';
import { CARD, GIFT_WRAP, getCatalog } from './catalog';
import { INTEREST_WORDS, OCCASION_WORDS, RELATION_WORDS, VIBE_WORDS, joinNice } from './words';
import type { CatalogItem, CompleteAnswers, GiftBox } from './types';

const MAX_ITEMS = 5;

/** Small deterministic PRNG so "Try another match" is reproducible. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function eligible(item: CatalogItem, a: CompleteAnswers): boolean {
  if (item.kind) return false;
  if (item.relationships && !item.relationships.includes(a.who)) return false;
  if (item.minHearts && a.hearts < item.minHearts) return false;
  if (item.needsPhoto && !a.details.hasPhoto) return false;
  if (item.minBudget && BUDGET_ORDER.indexOf(a.budget) < BUDGET_ORDER.indexOf(item.minBudget)) return false;
  return true;
}

export function scoreItem(item: CatalogItem, a: CompleteAnswers): number {
  const interestHits = item.interests.filter((i) => a.interests.includes(i)).length;
  const vibeHits = item.vibes.filter((v) => a.vibes.includes(v)).length;
  let s = interestHits * 3 + vibeHits * 2;
  if (item.occasions?.includes(a.occasion)) s += 1;
  if (item.minHearts) s += a.hearts * 1.5; // personal pieces matter more at higher depth
  if (interestHits === 0 && !item.minHearts) s -= 3;
  if (a.who === 'colleague' && item.vibes.includes('romantic')) s -= 4;
  return s;
}

export function buildBox(a: CompleteAnswers, seed = 1, catalog: CatalogItem[] = getCatalog()): GiftBox {
  const rand = mulberry32(seed);
  const budget = BUDGETS[a.budget];
  const fixed = [GIFT_WRAP, CARD];
  const fixedCost = fixed.reduce((t, i) => t + i.price, 0);
  const room = budget.max - fixedCost;

  const ranked = catalog.filter((i) => eligible(i, a) && i.price <= room)
    .map((item) => ({ item, score: scoreItem(item, a) + rand() * 2.5 }))
    .sort((x, y) => y.score - x.score);

  const picked: CatalogItem[] = [];
  let spent = 0;
  const primaryCount = new Map<string, number>();
  const fits = (i: CatalogItem) => spent + i.price <= room;
  const take = (i: CatalogItem) => {
    picked.push(i);
    spent += i.price;
    const p = i.interests[0] ?? 'personal';
    primaryCount.set(p, (primaryCount.get(p) ?? 0) + 1);
  };

  // A "Made for them" box always leads with its best personal piece.
  if (a.hearts === 3) {
    const personal = ranked.find((r) => r.item.minHearts && fits(r.item));
    if (personal) take(personal.item);
  }

  for (const { item, score } of ranked) {
    if (picked.length >= MAX_ITEMS) break;
    if (picked.includes(item) || !fits(item)) continue;
    if (score <= 0 && picked.length >= 2) continue;
    const p = item.interests[0] ?? 'personal';
    if ((primaryCount.get(p) ?? 0) >= 2) continue;
    if (picked.some((x) => x.icon === item.icon)) continue; // no two candles
    take(item);
  }

  // Below the chosen range: upgrade the cheapest pieces to richer matches.
  const minSpend = budget.min - fixedCost;
  for (let guard = 0; spent < minSpend && guard < MAX_ITEMS; guard++) {
    const cheapest = [...picked].sort((x, y) => x.price - y.price)[0];
    if (!cheapest) break;
    const upgrade = ranked.find(
      ({ item, score }) =>
        score > 0 &&
        !picked.includes(item) &&
        item.price > cheapest.price &&
        spent - cheapest.price + item.price <= room &&
        !picked.some((x) => x !== cheapest && x.icon === item.icon),
    );
    if (!upgrade) break;
    picked.splice(picked.indexOf(cheapest), 1);
    spent += upgrade.item.price - cheapest.price;
    picked.push(upgrade.item);
  }

  // Always deliver something, even on a tiny budget.
  if (picked.length === 0) {
    const cheapest = [...ranked].sort((x, y) => x.item.price - y.item.price)[0];
    if (cheapest) take(cheapest.item);
  }

  const items = [...picked.sort((x, y) => y.price - x.price), GIFT_WRAP, CARD];
  return {
    ...describe(a, picked),
    items,
    total: spent + fixedCost,
    budgetMax: budget.max,
    seed,
  };
}

function describe(a: CompleteAnswers, picked: CatalogItem[]) {
  const name = a.details.name?.trim();
  const who = name || RELATION_WORDS[a.who].noun;
  const interests = a.interests.map((i) => INTEREST_WORDS[i].phrase);
  const vibeAdj = VIBE_WORDS[a.vibes[0]].adj;
  const covered = a.interests.filter((i) => picked.some((p) => p.interests.includes(i)));
  const lead = INTEREST_WORDS[covered[0] ?? a.interests[0]].title;
  const personal = picked.filter((p) => p.minHearts);

  const why = [
    `Built around ${joinNice(covered.map((i) => INTEREST_WORDS[i].label.toLowerCase())) || 'what they love'}.`,
    `Feels ${joinNice(a.vibes.map((v) => VIBE_WORDS[v].adj))}, just like them.`,
    `Made for ${OCCASION_WORDS[a.occasion].phrase}.`,
  ];
  if (personal.length) why.push(`Includes a personal touch: ${personal.map((p) => p.name.toLowerCase()).join(', ')}.`);

  return {
    title: `The ${VIBE_WORDS[a.vibes[0]].title} ${lead} Box`,
    headline: name ? `Here's a match for ${name}` : `Here's a match for ${RELATION_WORDS[a.who].your}`,
    subtitle: `A ${vibeAdj} gift inspired by ${name ? `${name}'s` : 'their'} love for ${joinNice(interests)}.`,
    why,
    who,
  };
}
