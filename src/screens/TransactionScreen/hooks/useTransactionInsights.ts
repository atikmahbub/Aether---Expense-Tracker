import {
  TransactionAnalyticsModel,
  ExpenseCategoryModel,
} from "@trackingPortal/api/models";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useTransactionInsights = ({
  userId,
  month,
}: {
  userId?: string;
  month?: Dayjs;
}) => {
  const {
    categories,
    categoryLoading,
    isCategoryHydrated,
    incomeCategories,
    incomeCategoryLoading,
    refreshCategories,
  } = useStoreContext();
  const { transactionData } = useDatabase();

  const [expenseAnalytics, setExpenseAnalytics] = useState<TransactionAnalyticsModel | null>(null);
  const [incomeAnalytics, setIncomeAnalytics] = useState<TransactionAnalyticsModel | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const cache = useRef<Record<string, TransactionAnalyticsModel>>({});

  useEffect(() => {
    // Reset analytics when userId or month changes to avoid showing stale data
    setExpenseAnalytics(null);
    setIncomeAnalytics(null);
    cache.current = {};
  }, [userId, month]);

  const refreshAnalytics = useCallback(
    async ({ force }: { force?: boolean } = {}) => {
      if (!userId || !month || !transactionData) return;

      const key = `${userId}-${dayjs(month).format("YYYY-MM")}`;

      if (cache.current[`${key}-expense`] && cache.current[`${key}-income`] && !force) {
        setExpenseAnalytics(cache.current[`${key}-expense`]);
        setIncomeAnalytics(cache.current[`${key}-income`]);
        return;
      }

      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        // Computed locally from SQLite — works offline.
        const [expenseData, incomeData] = await Promise.all([
          transactionData.getAnalytics(userId, month, 'expense'),
          transactionData.getAnalytics(userId, month, 'income'),
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
    [transactionData, userId, month],
  );

  useEffect(() => {
    if (userId && isCategoryHydrated) {
      refreshAnalytics();
    }
  }, [userId, month, isCategoryHydrated, refreshAnalytics]);

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
