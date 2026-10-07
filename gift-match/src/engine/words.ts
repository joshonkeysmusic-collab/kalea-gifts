import type { Interest, Occasion, Relationship, Vibe } from './types';

export const RELATION_WORDS: Record<Relationship, { label: string; noun: string; your: string }> = {
  partner: { label: 'Partner', noun: 'your partner', your: 'your partner' },
  friend: { label: 'Friend', noun: 'your friend', your: 'your friend' },
  family: { label: 'Family', noun: 'your loved one', your: 'your loved one' },
  colleague: { label: 'Colleague', noun: 'your colleague', your: 'your colleague' },
  other: { label: 'Someone special', noun: 'someone special', your: 'someone special' },
};

export const OCCASION_WORDS: Record<Occasion, { label: string; phrase: string }> = {
  birthday: { label: 'Birthday', phrase: 'a birthday to remember' },
  thankyou: { label: 'Thank You', phrase: 'saying thank you' },
  celebration: { label: 'Celebration', phrase: 'a moment worth celebrating' },
  newbeginning: { label: 'New Beginning', phrase: 'a fresh new chapter' },
  anniversary: { label: 'Anniversary', phrase: 'an anniversary' },
  justbecause: { label: 'Just Because', phrase: 'no reason at all, the best reason' },
};

export const INTEREST_WORDS: Record<Interest, { label: string; phrase: string; title: string }> = {
  coffee: { label: 'Coffee', phrase: 'coffee', title: 'Coffee' },
  selfcare: { label: 'Self-care', phrase: 'slowing down', title: 'Self-Care' },
  flowers: { label: 'Flowers', phrase: 'flowers', title: 'Bloom' },
  beauty: { label: 'Beauty', phrase: 'beauty rituals', title: 'Glow' },
  wellness: { label: 'Wellness', phrase: 'wellbeing', title: 'Wellness' },
  home: { label: 'Home & calm evenings', phrase: 'calm evenings', title: 'Evenings-In' },
  books: { label: 'Books', phrase: 'a good book', title: 'Bookworm' },
  treats: { label: 'Sweet treats', phrase: 'sweet treats', title: 'Treats' },
  tech: { label: 'Tech & gadgets', phrase: 'clever gadgets', title: 'Gadget' },
  travel: { label: 'Travel', phrase: 'adventures', title: 'Wanderlust' },
};

export const VIBE_WORDS: Record<Vibe, { label: string; adj: string; title: string }> = {
  cozy: { label: 'Cozy', adj: 'cozy', title: 'Cozy' },
  elegant: { label: 'Elegant', adj: 'elegant', title: 'Elegant' },
  joyful: { label: 'Joyful', adj: 'joyful', title: 'Joyful' },
  romantic: { label: 'Romantic', adj: 'romantic', title: 'Romantic' },
  minimal: { label: 'Minimal', adj: 'minimal', title: 'Simple' },
  natural: { label: 'Natural', adj: 'natural', title: 'Natural' },
};

export function joinNice(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
