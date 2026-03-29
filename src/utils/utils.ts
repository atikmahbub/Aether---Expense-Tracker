import dayjs from 'dayjs';
import {
  CurrencyPreference,
  DEFAULT_CURRENCY,
} from '@trackingPortal/constants/currency';

export const getGreeting = (): string => {
  const currentHour = dayjs().hour();

  if (currentHour < 12) {
    return 'Good Morning';
  } else if (currentHour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

export const convertToKilo = (value: number): string | number => {
  const result = value / 1000;
  if (result >= 1) {
    return `${result}K`;
  } else {
    return value;
  }
};

export const convertKiloToNumber = (number: string | number): number => {
  const _number = number.toString().toLowerCase();

  if (_number.includes('k')) {
    const numericPart = parseFloat(_number.replace('k', ''));
    return numericPart * 1000;
  }

  return Number(_number);
};

const resolveCurrency = (currency?: CurrencyPreference) =>
  currency || DEFAULT_CURRENCY;

export const formatCurrency = (
  value: number,
  currency?: CurrencyPreference,
  options?: {showCode?: boolean},
) => {
  const activeCurrency = resolveCurrency(currency);
  let absFormatted: string;
  try {
    const formatter = new Intl.NumberFormat(activeCurrency.locale, {
      minimumFractionDigits: activeCurrency.decimals,
      maximumFractionDigits: activeCurrency.decimals,
    });
    absFormatted = formatter.format(Math.abs(value));
  } catch (error) {
    absFormatted = Math.abs(value).toFixed(activeCurrency.decimals);
  }
  const sign = value < 0 ? '-' : '';
  const base = `${activeCurrency.symbol}${absFormatted}`;
  if (options?.showCode) {
    return `${sign}${base} ${activeCurrency.code}`;
  }
  return `${sign}${base}`;
};
