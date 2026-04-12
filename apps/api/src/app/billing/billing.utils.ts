import Dinero from 'dinero.js';

/**
 * Creates a Dinero instance representing a monetary value in cents.
 * @param amountCents The amount in cents.
 * @param currency The currency string (default 'INR').
 * @returns A Dinero object.
 */
export function createMoney(amountCents: number, currency: string = 'INR'): Dinero.Dinero {
  // We ensure the amount is a safe integer to avoid float precision issues during object creation.
  return Dinero({ amount: Math.round(amountCents), currency: currency as Dinero.Currency });
}

/**
 * Calculates the total cost for a specific line item.
 * @param unitPriceCents The unit price in cents.
 * @param quantity The quantity of items.
 * @param currency The currency string (default 'INR').
 * @returns The total cost in cents.
 */
export function calculateLineTotalCents(unitPriceCents: number, quantity: number, currency: string = 'INR'): number {
  const price = createMoney(unitPriceCents, currency);
  return price.multiply(quantity).getAmount();
}

/**
 * Calculates a percentage of a given amount in cents (e.g., for calculating tax).
 * Dinero.js handles the percentage calculation robustly.
 * @param baseAmountCents The base amount in cents.
 * @param rateDecimal The rate as a decimal (e.g., 0.05 for 5%).
 * @param currency The currency string (default 'INR').
 * @returns The calculated percentage amount in cents.
 */
export function calculatePercentageCents(baseAmountCents: number, rateDecimal: number, currency: string = 'INR'): number {
  const base = createMoney(baseAmountCents, currency);
  // Dinero.js percentage method accepts a percentage value as an integer (e.g., 5 for 5%)
  // To support decimal like 0.05, we multiply by 100 to get 5.
  // Using Math.round to make sure we pass an integer percentage (e.g., 5).
  // E.g., rateDecimal = 0.05 -> rateDecimal * 100 = 5
  // Since rateDecimal might have arbitrary precision (e.g. 0.055 for 5.5%),
  // using percentage() with Math.round(rateDecimal * 100) loses precision.
  // Instead, multiply by an integer (rateDecimal * 10000) and then divide.
  // e.g. 0.055 * 10000 = 550, then divide by 10000 (which Dinero can do via divide or allocate).
  // Since multiply takes a float, but we want integer-safe logic, we can just do integer math:
  // base * (rate * 10000) / 10000
  const multiplier = Math.round(rateDecimal * 10000);
  return base.multiply(multiplier).divide(10000).getAmount();
}
