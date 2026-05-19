// ── Supported currencies across the Clinch platform ────────────
// Ordered by global freelance volume. All use 2 decimal places (cent model).

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'US Dollar',          flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',  label: 'Euro',               flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',  label: 'British Pound',      flag: '🇬🇧' },
  { code: 'INR', symbol: '₹',  label: 'Indian Rupee',       flag: '🇮🇳' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar',  flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar',    flag: '🇨🇦' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

/** Format cents to a human-readable currency string */
export function formatCents(
  cents: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Get the symbol for a currency code */
export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === code.toUpperCase())?.symbol ?? '$';
}

/** Default currency for new users */
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';
