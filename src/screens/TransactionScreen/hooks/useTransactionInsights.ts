import {
  TransactionAnalyticsModel,
  ExpenseCategoryModel,
} from "@trackingPortal/api/models";
import { UnixTimeStampString } from "@trackingPortal/api/primitives";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";

export const useTransactionInsights = ({
  userId,
  month,
}: {
  userId?: string;
  month?: Dayjs;
}) => {
  const {
    apiGateway,
    categories,
    categoryLoading,
    incomeCategories,
    incomeCategoryLoading,
    refreshCategories,
  } = useStoreContext();

  const [expenseAnalytics, setExpenseAnalytics] = useState<TransactionAnalyticsModel | null>(null);
  const [incomeAnalytics, setIncomeAnalytics] = useState<TransactionAnalyticsModel | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const cache = useRef<Record<string, TransactionAnalyticsModel>>({});

  const refreshAnalytics = useCallback(
    async ({ force }: { force?: boolean } = {}) => {
      if (!userId || !month) return;

      const key = `${userId}-${dayjs(month).format("YYYY-MM")}`;

      if (cache.current[`${key}-expense`] && cache.current[`${key}-income`] && !force) {
        setExpenseAnalytics(cache.current[`${key}-expense`]);
        setIncomeAnalytics(cache.current[`${key}-income`]);
        return;
      }

      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const commonParams = {
          userId: userId as any,
          date: dayjs(month)
            .startOf("month")
            .unix() as unknown as UnixTimeStampString,
        };

        const [expenseData, incomeData] = await Promise.all([
          apiGateway.transactionService.getTransactionAnalytics({ ...commonParams, type: 'expense' }),
          apiGateway.transactionService.getTransactionAnalytics({ ...commonParams, type: 'income' }),
        ]);

        cache.current[`${key}-expense`] = expenseData;
        cache.current[`${key}-income`] = incomeData;
        setExpenseAnalytics(expenseData);
        setIncomeAnalytics(incomeData);
      } catch (error) {
        console.log("Analytics error", error);
        setAnalyticsError("Failed to load analytics");
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [apiGateway, userId, month],
  );

  const categoryLookup = useMemo(() => {
    const lookup: Record<string, ExpenseCategoryModel> = {};
    categories.forEach(c => { lookup[c.id] = c; });
    incomeCategories.forEach(c => { lookup[c.id] = c; });
    return lookup;
  }, [categories, incomeCategories]);

  return {
    categories,
    categoryLoading,
    refreshCategories,
    expenseAnalytics,
    incomeAnalytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,
    categoryLookup,
    incomeCategories,
    incomeCategoryLoading,
  };
};
