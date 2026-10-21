import type { RecurringFrequency } from '@trackingPortal/api/models/RecurringRuleModel';
import { ordinal } from '@trackingPortal/db/services/RecurringDataService';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';
import dayjs from 'dayjs';
import { useCallback } from 'react';

const FREQUENCY_KEY = {
  weekly: 'repeat.weekly',
  monthly: 'repeat.monthly',
  yearly: 'repeat.yearly',
} as const;

/**
 * Translated counterparts of FREQUENCY_LABEL and describeFrequency from
 * RecurringDataService.
 */
export function useFrequencyText() {
  const { t, formatDate } = useTranslation();

  const frequencyLabel = useCallback(
    (frequency: RecurringFrequency) => t(FREQUENCY_KEY[frequency]),
    [t],
  );

  const describe = useCallback(
    (frequency: RecurringFrequency, start: Date) => {
      const d = dayjs(start);
      if (frequency === 'weekly') {
        return t('repeat.weeklyOn', { day: formatDate(d, 'dddd') });
      }
      if (frequency === 'yearly') {
        return t('repeat.yearlyOn', { date: formatDate(d, 'D MMM') });
      }
      return t('repeat.monthlyOn', { nth: ordinal(d.date()), n: d.date() });
    },
    [t, formatDate],
  );

  return { frequencyLabel, describeFrequency: describe };
}
