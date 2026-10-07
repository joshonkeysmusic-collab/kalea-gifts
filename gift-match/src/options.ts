import type { BudgetId, HeartLevel, Interest, Occasion, Relationship, Vibe } from './engine/types';
import type { IconKey } from './components/Icon';

export interface Option<T extends string> {
  id: T;
  label: string;
  icon: IconKey;
  colors: [string, string];
}

export const WHO: Option<Relationship>[] = [
  { id: 'partner', label: 'Partner', icon: 'heart', colors: ['#FF7A93', '#C21E4A'] },
  { id: 'friend', label: 'Friend', icon: 'smile', colors: ['#FFB36B', '#D9542E'] },
  { id: 'family', label: 'Family', icon: 'home', colors: ['#4BE3A2', '#0F7F50'] },
  { id: 'colleague', label: 'Colleague', icon: 'coffee', colors: ['#7F9BFF', '#2B3CC2'] },
  { id: 'other', label: 'Someone else', icon: 'sparkles', colors: ['#EE86FB', '#8E1FA8'] },
];

export const OCCASIONS: Option<Occasion>[] = [
  { id: 'birthday', label: 'Birthday', icon: 'cake', colors: ['#FF7A93', '#C21E4A'] },
  { id: 'thankyou', label: 'Thank You', icon: 'mail', colors: ['#5FD8FF', '#0F6DAE'] },
  { id: 'celebration', label: 'Celebration', icon: 'wine', colors: ['#FFD15C', '#C77A0A'] },
  { id: 'newbeginning', label: 'New Beginning', icon: 'sunrise', colors: ['#FFB36B', '#D9542E'] },
  { id: 'anniversary', label: 'Anniversary', icon: 'heart', colors: ['#EE86FB', '#8E1FA8'] },
  { id: 'justbecause', label: 'Just Because', icon: 'flower', colors: ['#4BE3A2', '#0F7F50'] },
];

export const INTERESTS: Option<Interest>[] = [
  { id: 'coffee', label: 'Coffee', icon: 'coffee', colors: ['#E08A4A', '#7A3510'] },
  { id: 'selfcare', label: 'Self-care', icon: 'bath', colors: ['#F59BD0', '#A8327F'] },
  { id: 'flowers', label: 'Flowers', icon: 'flower', colors: ['#FF7A7A', '#C21E3A'] },
  { id: 'beauty', label: 'Beauty', icon: 'spray', colors: ['#FFB36B', '#D9542E'] },
  { id: 'wellness', label: 'Wellness', icon: 'leaf', colors: ['#4BE3A2', '#0F7F50'] },
  { id: 'home', label: 'Home / calm evenings', icon: 'flame', colors: ['#FFD15C', '#C77A0A'] },
  { id: 'books', label: 'Books', icon: 'book', colors: ['#7F9BFF', '#2B3CC2'] },
  { id: 'treats', label: 'Sweet treats', icon: 'candy', colors: ['#EE86FB', '#8E1FA8'] },
  { id: 'tech', label: 'Tech & gadgets', icon: 'headphones', colors: ['#5FD8FF', '#0F6DAE'] },
  { id: 'travel', label: 'Travel', icon: 'plane', colors: ['#3FE0CB', '#0B7368'] },
];

export const VIBES: Option<Vibe>[] = [
  { id: 'cozy', label: 'Cozy', icon: 'sofa', colors: ['#E08A4A', '#7A3510'] },
  { id: 'elegant', label: 'Elegant', icon: 'wine', colors: ['#A48BFF', '#5B3BE0'] },
  { id: 'joyful', label: 'Joyful', icon: 'sun', colors: ['#FFD15C', '#C77A0A'] },
  { id: 'romantic', label: 'Romantic', icon: 'sunset', colors: ['#FF7A93', '#C21E4A'] },
  { id: 'minimal', label: 'Minimal', icon: 'feather', colors: ['#B9C3D6', '#56627A'] },
  { id: 'natural', label: 'Natural', icon: 'sprout', colors: ['#4BE3A2', '#0F7F50'] },
];

export const BUDGET_OPTIONS: { id: BudgetId; label: string; hint: string }[] = [
  { id: 'u100', label: 'Under AED 100', hint: 'A sweet little something' },
  { id: '100-200', label: 'AED 100 – 200', hint: 'Thoughtful and generous' },
  { id: '200-300', label: 'AED 200 – 300', hint: 'Our most popular range' },
  { id: '300-500', label: 'AED 300 – 500', hint: 'A gift to remember' },
  { id: '500+', label: 'AED 500+', hint: 'Go all out' },
];

export const HEART_OPTIONS: { id: HeartLevel; label: string; text: string }[] = [
  { id: 1, label: 'Thoughtful', text: 'A beautifully matched gift based on the essentials.' },
  { id: 2, label: 'Personal', text: 'More tailored to who they are.' },
  { id: 3, label: 'Made for Them', text: 'A gift that feels unmistakably theirs.' },
];
