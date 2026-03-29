export type CurrencyPreference = {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
};

export const SUPPORTED_CURRENCIES: CurrencyPreference[] = [
  {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    locale: 'bn-BD',
    decimals: 2,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimals: 2,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimals: 2,
  },
];

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0];
export const CURRENCY_PREFERENCE_KEY = '@aether:currency';

export const findCurrencyByCode = (code?: string) =>
  SUPPORTED_CURRENCIES.find(
    currency => currency.code.toUpperCase() === code?.toUpperCase(),
  );
