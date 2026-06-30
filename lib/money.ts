/**
 * Money utilities — all DB values are in KOBO (₦1 = 100 kobo).
 * Use these helpers everywhere to avoid confusion.
 */

export const SERVICE_FEE_KOBO = 100_000; // ₦1,000

/** Convert kobo to Naira string, e.g. 100000 → "₦1,000.00" */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(naira);
}

/** Convert Naira (user input) to kobo for DB storage */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** Convert kobo to Naira number */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Build the total amount to charge via Paystack.
 * Always adds the ₦1,000 service fee.
 * Returns kobo — Paystack expects kobo.
 */
export function buildPaystackAmount(productTotalKobo: number): number {
  return productTotalKobo + SERVICE_FEE_KOBO;
}
