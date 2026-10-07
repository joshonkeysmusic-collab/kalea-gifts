import type { BudgetId } from './types';

export const BUDGETS: Record<BudgetId, { label: string; min: number; max: number }> = {
  u100: { label: 'Under AED 100', min: 0, max: 100 },
  '100-200': { label: 'AED 100 – 200', min: 100, max: 200 },
  '200-300': { label: 'AED 200 – 300', min: 200, max: 300 },
  '300-500': { label: 'AED 300 – 500', min: 300, max: 500 },
  '500+': { label: 'AED 500+', min: 500, max: 800 },
};

/** Cheapest to dearest. */
export const BUDGET_ORDER: BudgetId[] = ['u100', '100-200', '200-300', '300-500', '500+'];

/** Gift wrap that goes in every box; it comes out of the budget before any gift does. */
export const WRAP_COST = 15;

/** The lowest budget tier a product of this price can appear in. */
export function earliestTier(price: number): BudgetId | null {
  return BUDGET_ORDER.find((id) => price <= BUDGETS[id].max - WRAP_COST) ?? null;
}
