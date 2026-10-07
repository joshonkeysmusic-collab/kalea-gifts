export type Relationship = 'partner' | 'friend' | 'family' | 'colleague' | 'other';
export type Occasion = 'birthday' | 'thankyou' | 'celebration' | 'newbeginning' | 'anniversary' | 'justbecause';
export type Interest =
  | 'coffee' | 'selfcare' | 'flowers' | 'beauty' | 'wellness'
  | 'home' | 'books' | 'treats' | 'tech' | 'travel';
export type Vibe = 'cozy' | 'elegant' | 'joyful' | 'romantic' | 'minimal' | 'natural';
export type BudgetId = 'u100' | '100-200' | '200-300' | '300-500' | '500+';
export type HeartLevel = 1 | 2 | 3;
export type CategoryId =
  | 'coffee' | 'selfcare' | 'flowers' | 'beauty' | 'wellness' | 'home' | 'books' | 'treats' | 'tech' | 'travel'
  | 'candles' | 'cakes' | 'sweets' | 'experiences' | 'personalised';

export interface Details {
  name?: string;
  birthday?: string;
  hasPhoto?: boolean;
  handle?: string;
  message?: string;
  notes?: string;
}

export interface Answers {
  who?: Relationship;
  occasion?: Occasion;
  interests: Interest[];
  vibes: Vibe[];
  budget?: BudgetId;
  hearts?: HeartLevel;
  details: Details;
}

export type CompleteAnswers = Required<Omit<Answers, 'details'>> & { details: Details };

export interface CatalogItem {
  id: string;
  name: string;
  blurb: string;
  price: number; // AED
  icon: string; // lucide icon key, see components/Icon
  tone: string; // hex accent for the item swatch
  interests: Interest[];
  vibes: Vibe[];
  occasions?: Occasion[];
  relationships?: Relationship[]; // if set, only suits these
  minHearts?: HeartLevel; // personalized items
  needsPhoto?: boolean;
  kind?: 'base' | 'card';
  /** Catalogue category, used by the coverage audit. Not used for scoring. */
  category?: CategoryId;
  /** Product photo; shown instead of the icon when present. */
  imageUrl?: string;
  /** Free-form labels from the admin catalogue. Not used for scoring. */
  tags?: string[];
  /** Hidden from budgets below this tier. */
  minBudget?: BudgetId;
}

export interface GiftBox {
  title: string;
  headline: string;
  who: string;
  subtitle: string;
  why: string[];
  items: CatalogItem[];
  total: number;
  budgetMax: number;
  seed: number;
}
