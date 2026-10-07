import { BUDGETS } from './budgets';
import { compileProduct } from './rules';
import type { Product } from './product';
import type { CatalogItem, CategoryId } from './types';

// Kept here so existing imports keep working; the table lives in budgets.ts.
export { BUDGETS };

export const GIFT_WRAP: CatalogItem = {
  id: 'wrap', name: 'Gift wrap & ribbon', blurb: 'Beautifully packed and ready to give.',
  price: 15, icon: 'ribbon', tone: '#d9a79a', interests: [], vibes: [], kind: 'base',
};

export const CARD: CatalogItem = {
  id: 'card', name: 'Handwritten card', blurb: 'Your words, written with care.',
  price: 0, icon: 'mail', tone: '#c9a27e', interests: [], vibes: [], kind: 'card',
};

const PARTNER = ['partner'] as CatalogItem['relationships'];
const CLOSE = ['partner', 'friend', 'family'] as CatalogItem['relationships'];

const SEED_ITEMS: CatalogItem[] = [
  // Coffee
  { id: 'beans', name: 'Specialty coffee', blurb: 'A rich single-origin blend for their quiet moments.', price: 65, icon: 'coffee', tone: '#8a5a3c', interests: ['coffee'], vibes: ['cozy', 'natural'] },
  { id: 'mug', name: 'Handmade latte mug', blurb: 'Stoneware, glazed by hand, made for slow mornings.', price: 55, icon: 'cup', tone: '#b98a6a', interests: ['coffee', 'home'], vibes: ['cozy', 'joyful'] },
  { id: 'pourover', name: 'Ceramic pour-over set', blurb: 'A calm little ritual for the perfect cup.', price: 140, icon: 'coffee', tone: '#a4846c', interests: ['coffee'], vibes: ['minimal', 'elegant'] },
  { id: 'arabic-coffee', name: 'Arabic coffee & dates', blurb: 'Cardamom-spiced coffee with Medjool dates.', price: 85, icon: 'bean', tone: '#7d5536', interests: ['coffee', 'treats'], vibes: ['elegant', 'cozy'], occasions: ['thankyou', 'celebration', 'newbeginning'] },
  { id: 'coffee-class', name: 'Barista masterclass', blurb: 'A hands-on session to master latte art.', price: 280, icon: 'chef', tone: '#6f4a33', interests: ['coffee'], vibes: ['joyful'] },

  // Self-care
  { id: 'body-butter', name: 'Body butter', blurb: 'Nourishes and leaves a soft, lasting scent.', price: 70, icon: 'droplets', tone: '#e3b9a6', interests: ['selfcare', 'beauty'], vibes: ['cozy', 'natural'] },
  { id: 'hand-cream', name: 'Hand cream', blurb: 'Keeps their hands soft and refreshed.', price: 45, icon: 'droplet', tone: '#e8c7b4', interests: ['selfcare'], vibes: ['minimal', 'natural'] },
  { id: 'bath-soak', name: 'Mineral bath soak', blurb: 'Dead Sea salts with lavender and rose.', price: 60, icon: 'bath', tone: '#c9b1c9', interests: ['selfcare', 'wellness'], vibes: ['cozy', 'natural'] },
  { id: 'silk-mask', name: 'Silk sleep mask', blurb: 'Pure mulberry silk for deeper, softer sleep.', price: 95, icon: 'moon', tone: '#d7a9a0', interests: ['selfcare'], vibes: ['elegant', 'romantic'] },
  { id: 'spa', name: 'Spa afternoon voucher', blurb: 'A massage and steam, just for them.', price: 350, icon: 'sparkles', tone: '#caa59a', interests: ['selfcare', 'wellness'], vibes: ['elegant', 'cozy'] },

  // Flowers
  { id: 'bouquet', name: 'Fresh flowers', blurb: 'A touch of beauty to brighten their day.', price: 150, icon: 'flower', tone: '#e7a3a8', interests: ['flowers'], vibes: ['romantic', 'joyful', 'elegant'] },
  { id: 'dried', name: 'Dried flower posy', blurb: 'Pampas and bunny tails that last for months.', price: 85, icon: 'flower2', tone: '#d6b892', interests: ['flowers', 'home'], vibes: ['natural', 'minimal'] },
  { id: 'rose-dome', name: 'Preserved rose dome', blurb: 'A real rose that stays perfect for a year.', price: 220, icon: 'flower', tone: '#c96f7a', interests: ['flowers'], vibes: ['romantic', 'elegant'], relationships: ['partner', 'family'] },
  { id: 'seed-kit', name: 'Wildflower seed kit', blurb: 'Grow a little garden of memories.', price: 40, icon: 'sprout', tone: '#9db48a', interests: ['flowers', 'wellness'], vibes: ['natural', 'joyful'] },

  // Beauty
  { id: 'tint', name: 'Lip & cheek tint', blurb: 'A sheer, dewy flush in a universal shade.', price: 75, icon: 'palette', tone: '#d98a8a', interests: ['beauty'], vibes: ['joyful', 'romantic'] },
  { id: 'fragrance-set', name: 'Fragrance discovery set', blurb: 'Six niche scents to find their signature.', price: 160, icon: 'spray', tone: '#c7a98f', interests: ['beauty'], vibes: ['elegant', 'joyful'] },
  { id: 'roller', name: 'Rose quartz roller', blurb: 'A cooling facial ritual for calm mornings.', price: 65, icon: 'gem', tone: '#e6b8b8', interests: ['beauty', 'selfcare'], vibes: ['natural', 'romantic'] },
  { id: 'perfume', name: 'Signature perfume', blurb: 'Oud, rose and amber. Unforgettable.', price: 420, icon: 'spray', tone: '#a87862', interests: ['beauty'], vibes: ['elegant', 'romantic'] },
  { id: 'pouch', name: 'Linen makeup pouch', blurb: 'Soft, structured and everyday-pretty.', price: 55, icon: 'bag', tone: '#d8c3ae', interests: ['beauty', 'travel'], vibes: ['minimal', 'joyful'] },

  // Wellness
  { id: 'tea', name: 'Herbal tea collection', blurb: 'Chamomile, mint and rooibos for slow evenings.', price: 60, icon: 'leaf', tone: '#a8b98e', interests: ['wellness', 'home'], vibes: ['cozy', 'natural'] },
  { id: 'journal', name: 'Guided gratitude journal', blurb: 'Five minutes a day to feel lighter.', price: 55, icon: 'book', tone: '#c4b49a', interests: ['wellness', 'books'], vibes: ['minimal', 'natural'] },
  { id: 'yoga-mat', name: 'Cork yoga mat', blurb: 'Natural grip for grounded practice.', price: 180, icon: 'mountain', tone: '#b79a72', interests: ['wellness'], vibes: ['natural', 'minimal'] },
  { id: 'diffuser', name: 'Ceramic oil diffuser', blurb: 'With a calming eucalyptus blend.', price: 190, icon: 'flame', tone: '#bfae9b', interests: ['wellness', 'home'], vibes: ['natural', 'cozy', 'minimal'] },
  { id: 'massager', name: 'Mini massage gun', blurb: 'Pocket-size relief after long days.', price: 260, icon: 'dumbbell', tone: '#8f8a86', interests: ['wellness', 'tech'], vibes: ['minimal'] },

  // Home / calm evenings
  { id: 'candle', name: 'Scented candle', blurb: 'Creates a calm, cozy atmosphere.', price: 85, icon: 'flame', tone: '#e2c095', interests: ['home', 'selfcare'], vibes: ['cozy', 'romantic'] },
  { id: 'throw', name: 'Soft knit throw', blurb: 'Their new favourite thing on the sofa.', price: 240, icon: 'sofa', tone: '#cdb6a2', interests: ['home'], vibes: ['cozy', 'elegant'] },
  { id: 'vase', name: 'Ceramic bud vase', blurb: 'Simple, sculptural, perfect with one stem.', price: 70, icon: 'lamp', tone: '#d9cfc2', interests: ['home', 'flowers'], vibes: ['minimal', 'natural'] },
  { id: 'pillow-spray', name: 'Lavender pillow spray', blurb: 'A few sprays for a deeper sleep.', price: 50, icon: 'moon', tone: '#b8a7c9', interests: ['home', 'wellness'], vibes: ['cozy', 'natural'] },

  // Books
  { id: 'novel', name: 'A novel we think they will love', blurb: 'Hand-picked from this season’s best.', price: 60, icon: 'book', tone: '#9c8169', interests: ['books'], vibes: ['cozy', 'minimal'] },
  { id: 'poetry', name: 'Poetry collection', blurb: 'Small, beautiful words for big feelings.', price: 55, icon: 'feather', tone: '#b58f86', interests: ['books'], vibes: ['romantic', 'elegant'] },
  { id: 'bookmark', name: 'Leather bookmark', blurb: 'Hand-stitched, made to last for years.', price: 35, icon: 'bookmark', tone: '#8e6a4d', interests: ['books'], vibes: ['elegant', 'minimal'] },
  { id: 'book-light', name: 'Warm reading light', blurb: 'Clip-on glow for late-night chapters.', price: 70, icon: 'lamp', tone: '#e0c58f', interests: ['books', 'home'], vibes: ['cozy', 'minimal'] },

  // Treats
  { id: 'chocolates', name: 'Artisan chocolates', blurb: 'Pistachio, rose and salted caramel.', price: 90, icon: 'candy', tone: '#7b4b3a', interests: ['treats'], vibes: ['romantic', 'joyful', 'elegant'] },
  { id: 'cookies', name: 'Brown-butter cookies', blurb: 'Baked fresh, gone in minutes.', price: 45, icon: 'cookie', tone: '#c08f5c', interests: ['treats'], vibes: ['cozy', 'joyful'] },
  { id: 'macarons', name: 'Macaron box', blurb: 'Twelve pastel bites of joy.', price: 75, icon: 'cake', tone: '#e9b2bd', interests: ['treats'], vibes: ['joyful', 'elegant'] },
  { id: 'honey', name: 'Raw honey trio', blurb: 'Sidr, wildflower and acacia.', price: 70, icon: 'droplet', tone: '#d9a54a', interests: ['treats', 'wellness'], vibes: ['natural', 'cozy'] },
  { id: 'dates-platter', name: 'Stuffed dates platter', blurb: 'An elegant tray for sharing.', price: 120, icon: 'gift', tone: '#8d5b3e', interests: ['treats'], vibes: ['elegant'], occasions: ['thankyou', 'celebration', 'newbeginning'] },

  // Tech
  { id: 'cable-kit', name: 'Desk tidy & phone grip', blurb: 'Small upgrades for a smoother day.', price: 45, icon: 'phone', tone: '#a5a09a', interests: ['tech'], vibes: ['minimal', 'joyful'] },
  { id: 'charger', name: 'Wireless charging stand', blurb: 'Walnut and fabric, always topped up.', price: 150, icon: 'phone', tone: '#8b7b6b', interests: ['tech', 'home'], vibes: ['minimal', 'elegant'] },
  { id: 'speaker', name: 'Mini Bluetooth speaker', blurb: 'Big sound for spontaneous dance breaks.', price: 160, icon: 'music', tone: '#c99a85', interests: ['tech'], vibes: ['joyful'] },
  { id: 'instant-camera', name: 'Instant camera', blurb: 'For memories they can hold.', price: 420, icon: 'camera', tone: '#d8b4a0', interests: ['tech', 'travel'], vibes: ['joyful', 'romantic'] },
  { id: 'earbuds', name: 'Wireless earbuds', blurb: 'Crisp, quiet, beautifully simple.', price: 380, icon: 'headphones', tone: '#9e9a95', interests: ['tech'], vibes: ['minimal'] },

  // Travel
  { id: 'candle-tin', name: 'Travel candle tin', blurb: 'Home, wherever they land.', price: 45, icon: 'flame', tone: '#d5b48c', interests: ['travel', 'home'], vibes: ['cozy'] },
  { id: 'passport', name: 'Leather passport holder', blurb: 'For the next adventure, in style.', price: 140, icon: 'plane', tone: '#a07b5c', interests: ['travel'], vibes: ['elegant', 'minimal'] },
  { id: 'world-map', name: 'Scratch-off world map', blurb: 'Where to next? Scratch to find out.', price: 110, icon: 'map', tone: '#b9a689', interests: ['travel'], vibes: ['joyful'] },
  { id: 'weekender', name: 'Canvas weekender bag', blurb: 'Packed and ready for a spontaneous escape.', price: 290, icon: 'bag', tone: '#b49a7d', interests: ['travel'], vibes: ['minimal', 'natural'] },

  // Experiences
  { id: 'pottery', name: 'Pottery class for two', blurb: 'Make something together, with your hands.', price: 300, icon: 'palette', tone: '#c08a6a', interests: ['home', 'wellness'], vibes: ['joyful', 'natural'], relationships: CLOSE },
  { id: 'dinner', name: 'Dinner for two voucher', blurb: 'A table, candlelight and nowhere else to be.', price: 450, icon: 'wine', tone: '#9b4f5a', interests: ['treats', 'travel'], vibes: ['romantic', 'elegant'], relationships: PARTNER },

  // Personalized (unlocked by heart level)
  { id: 'mono-mug', name: 'Monogrammed mug', blurb: 'Their initials, hand-painted.', price: 70, icon: 'cup', tone: '#c9a27e', interests: ['coffee', 'home'], vibes: ['cozy', 'minimal'], minHearts: 2 },
  { id: 'photo-print', name: 'Framed photo print', blurb: 'Your photo, printed on archival paper.', price: 90, icon: 'frame', tone: '#bfa48c', interests: ['home'], vibes: ['cozy', 'romantic', 'minimal'], minHearts: 2, needsPhoto: true },
  { id: 'reasons-jar', name: '"Reasons I love you" jar', blurb: '52 little notes, one for every week.', price: 60, icon: 'heart', tone: '#d98b8b', interests: [], vibes: ['romantic', 'joyful'], minHearts: 2, relationships: PARTNER },
  { id: 'memory-letter', name: 'Memory letter', blurb: 'We help you write a letter they will keep forever.', price: 40, icon: 'scroll', tone: '#c7a985', interests: ['books'], vibes: ['romantic', 'natural', 'elegant'], minHearts: 3, relationships: CLOSE },
  { id: 'name-necklace', name: 'Engraved initial necklace', blurb: 'Gold-plated, engraved with their initial.', price: 280, icon: 'gem', tone: '#d4af7a', interests: ['beauty'], vibes: ['elegant', 'romantic', 'minimal'], minHearts: 3, relationships: CLOSE },
  { id: 'portrait', name: 'Custom illustrated portrait', blurb: 'Hand-drawn from your photo.', price: 250, icon: 'pen', tone: '#c49a8a', interests: ['home'], vibes: ['joyful', 'romantic', 'elegant'], minHearts: 3, needsPhoto: true, relationships: CLOSE },
  { id: 'desk-plant', name: 'Desk plant with name tag', blurb: 'A little green friend with their name on it.', price: 65, icon: 'sprout', tone: '#8ea67a', interests: ['wellness', 'home'], vibes: ['natural', 'minimal', 'joyful'], minHearts: 2 },
];

/**
 * Category for each built-in gift. Anything not listed takes its first interest,
 * which is also its category id (coffee, selfcare, flowers, ...).
 */
const SEED_CATEGORY: Record<string, CategoryId> = {
  candle: 'candles', 'candle-tin': 'candles',
  chocolates: 'sweets', cookies: 'sweets', macarons: 'sweets',
  'coffee-class': 'experiences', spa: 'experiences', pottery: 'experiences', dinner: 'experiences',
  'mono-mug': 'personalised', 'photo-print': 'personalised', 'reasons-jar': 'personalised',
  'memory-letter': 'personalised', 'name-necklace': 'personalised', portrait: 'personalised', 'desk-plant': 'personalised',
};

/** The built-in gifts. Admin products are added on top of these (see getCatalog). */
export const SEED_CATALOG: CatalogItem[] = SEED_ITEMS.map((i) => ({
  ...i,
  category: SEED_CATEGORY[i.id] ?? (i.interests[0] as CategoryId),
}));

/**
 * Merge admin products into a base catalogue. A product with an existing id replaces it
 * (keeping its place); `active: false` removes it. Pure, so tests and the CLI can use it.
 */
export function mergeCatalog(base: CatalogItem[], products: Product[]): CatalogItem[] {
  const byId = new Map(base.map((i) => [i.id, i]));
  for (const p of products) {
    if (p.active === false) byId.delete(p.id);
    else byId.set(p.id, compileProduct(p));
  }
  return [...byId.values()];
}

let custom: Product[] = [];
let merged: CatalogItem[] | null = null;

/** Replace the admin products (for example after loading catalog.custom.json). */
export function setCustomProducts(products: Product[]): void {
  custom = products;
  merged = null;
}

export function getCustomProducts(): Product[] {
  return custom;
}

/** The catalogue the engine scores: built-in gifts plus admin products. */
export function getCatalog(): CatalogItem[] {
  return (merged ??= mergeCatalog(SEED_CATALOG, custom));
}
