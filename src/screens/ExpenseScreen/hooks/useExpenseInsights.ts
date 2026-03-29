import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  ExpenseAnalyticsModel,
  ExpenseCategoryModel,
} from "@trackingPortal/api/models";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { UnixTimeStampString } from "@trackingPortal/api/primitives";

interface RefreshOptions {
  force?: boolean;
}

interface UseExpenseInsightsParams {
  userId?: string;
  month?: Dayjs;
}

export const useExpenseInsights = ({
  userId,
  month,
}: UseExpenseInsightsParams) => {
  const { apiGateway, categories, categoryLoading, refreshCategories } =
    useStoreContext();

  const [analytics, setAnalytics] = useState<ExpenseAnalyticsModel | null>(
    null,
  );
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const analyticsCache = useRef<Record<string, ExpenseAnalyticsModel>>({});

  const refreshAnalytics = useCallback(
    async ({ force }: RefreshOptions = {}) => {
      if (!userId || !month) {
        setAnalytics(null);
        return;
      }

      const monthKey = dayjs(month).format("YYYY-MM");
      const cacheKey = `${userId}-${monthKey}`;

      if (analyticsCache.current[cacheKey] && !force) {
        setAnalytics(analyticsCache.current[cacheKey]);
        return;
      }

      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const payload = await apiGateway.expenseService.getExpenseAnalytics({
          userId: userId as any,
          date: dayjs(month)
            .startOf("month")
            .unix() as unknown as UnixTimeStampString,
        });
        analyticsCache.current[cacheKey] = payload;
        setAnalytics(payload);
      } catch (error) {
        console.log("Failed to fetch analytics", error);
        setAnalyticsError("Unable to load analytics");
        if (force) {
          delete analyticsCache.current[cacheKey];
        }
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [apiGateway, month, userId],
  );

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  const categoryLookup = useMemo(() => {
    return categories.reduce<Record<string, ExpenseCategoryModel>>(
      (acc, category) => {
        acc[category.id] = category;
        return acc;
      },
      {},
    );
  }, [categories]);

  return {
    categories,
    categoryLoading,
    categoryError: null,
    refreshCategories,
    analytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,
    categoryLookup,
  } as const;
};
