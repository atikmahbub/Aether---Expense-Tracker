import dayjs from 'dayjs';
import {
  CurrencyPreference,
  DEFAULT_CURRENCY,
} from '@trackingPortal/constants/currency';

const ENGLISH_LOCALE = 'en-US';

type NumberFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumIntegerDigits?: number;
  useGrouping?: boolean;
  prefix?: string;
  suffix?: string;
  absolute?: boolean;
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
};

const formatWithEnglishDigits = (
  value: number,
  {
    prefix = '',
    suffix = '',
    absolute = false,
    useGrouping = true,
    ...intlOverrides
  }: NumberFormatOptions = {},
) => {
  const targetValue = absolute ? Math.abs(value) : value;
  const intlOptions: Intl.NumberFormatOptions = {
    useGrouping,
    minimumFractionDigits: intlOverrides.minimumFractionDigits,
    maximumFractionDigits: intlOverrides.maximumFractionDigits,
    minimumIntegerDigits: intlOverrides.minimumIntegerDigits,
    signDisplay: intlOverrides.signDisplay,
  };

  const safeFormat = () =>
    new Intl.NumberFormat(ENGLISH_LOCALE, intlOptions).format(targetValue);

  let formattedValue: string;
  try {
    formattedValue = safeFormat();
  } catch (error) {
    formattedValue = targetValue.toLocaleString(ENGLISH_LOCALE, intlOptions);
  }

  return `${prefix}${formattedValue}${suffix}`;
};

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
    return `${formatWithEnglishDigits(result, {
      maximumFractionDigits: result < 10 ? 1 : 0,
    })}K`;
  }
  return formatWithEnglishDigits(value, {minimumFractionDigits: 0, maximumFractionDigits: 0});
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

type CurrencyFormatOptions = {
  showCode?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  hideSymbol?: boolean;
};

export const formatNumber = (
  value: number,
  options?: NumberFormatOptions,
) => formatWithEnglishDigits(value, options);

export const formatCurrency = (
  value: number,
  currency?: CurrencyPreference,
  options?: CurrencyFormatOptions,
) => {
  const activeCurrency = resolveCurrency(currency);
  const minimumFractionDigits =
    options?.minimumFractionDigits ?? activeCurrency.decimals;
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? activeCurrency.decimals;
  const absFormatted = formatWithEnglishDigits(Math.abs(value), {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: options?.useGrouping,
  });
  const sign = value < 0 ? '-' : '';
  const symbol = options?.hideSymbol ? '' : activeCurrency.symbol;
  const base = `${symbol}${absFormatted}`;
  if (options?.showCode) {
    return `${sign}${base} ${activeCurrency.code}`;
  }
  return `${sign}${base}`;
};
