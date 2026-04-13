import { useState, useEffect, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import { UnixTimeStampString } from '@trackingPortal/api/primitives';
import { colors } from '@trackingPortal/themes/colors';
import { formatNumber } from '@trackingPortal/utils/utils';

interface TrendSnapshotOptions {
  userId?: string;
  totalValue: number;
  type: 'expense' | 'income';
  filterMonth: Dayjs;
}

export const useTrendSnapshot = ({
  userId,
  totalValue,
  type,
  filterMonth,
}: TrendSnapshotOptions) => {
  const { apiGateway } = useStoreContext();
  const [previousMonthTotal, setPreviousMonthTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const previousMonthDate = useMemo(
    () => dayjs(filterMonth).subtract(1, 'month'),
    [filterMonth],
  );
  
  const previousMonthLabel = previousMonthDate.format('MMM');

  useEffect(() => {
    let isMounted = true;
    const fetchPreviousMonth = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await apiGateway.transactionService.getTransactionsByUser({
          userId: userId as any,
          date: previousMonthDate.unix() as unknown as UnixTimeStampString,
          type,
        });
        const total = response.reduce((sum, t) => sum + t.amount, 0);
        if (isMounted) setPreviousMonthTotal(total);
      } catch (error) {
        console.log('Failed to fetch previous month total', error);
        if (isMounted) setPreviousMonthTotal(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreviousMonth();
    return () => { isMounted = false; };
  }, [apiGateway, userId, previousMonthDate, type]);

  const trend = useMemo(() => {
    if (loading) {
      return {
        label: 'Measuring…',
        color: colors.subText,
        icon: 'progress-clock',
        isLower: null,
        percent: 0,
      };
    }

    if (previousMonthTotal === null || previousMonthTotal === 0 && totalValue === 0) {
      return {
        label: 'No comparison',
        color: colors.subText,
        icon: 'minus',
        isLower: null,
        percent: 0,
      };
    }

    if (previousMonthTotal === 0) {
      return null;
    }

    const delta = totalValue - previousMonthTotal;
    const isLower = delta <= 0;
    const percent = (Math.abs(delta) / previousMonthTotal) * 100;
    
    const isBetter = type === 'expense' ? isLower : !isLower;

    return {
      label: `${formatNumber(percent, { maximumFractionDigits: 1 })}% ${isLower ? 'lower' : 'higher'} vs ${previousMonthLabel}`,
      color: isBetter ? colors.accent : colors.error,
      icon: isLower ? 'arrow-bottom-right' : 'arrow-top-right',
      isLower,
      percent,
    };
  }, [loading, previousMonthTotal, totalValue, previousMonthLabel, type]);

  return { trend, loading };
};
