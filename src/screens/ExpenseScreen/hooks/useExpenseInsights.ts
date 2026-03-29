import {
  ExpenseAnalyticsModel,
  ExpenseCategoryModel,
} from "@trackingPortal/api/models";
import { UnixTimeStampString } from "@trackingPortal/api/primitives";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";

export const useExpenseInsights = ({
  userId,
  month,
}: {
  userId?: string;
  month?: Dayjs;
}) => {
  const { apiGateway, categories, categoryLoading, refreshCategories } =
    useStoreContext();

  const [analytics, setAnalytics] = useState<ExpenseAnalyticsModel | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const cache = useRef<Record<string, ExpenseAnalyticsModel>>({});

  const refreshAnalytics = useCallback(
    async ({ force }: { force?: boolean } = {}) => {
      if (!userId || !month) return;

      const key = `${userId}-${dayjs(month).format("YYYY-MM")}`;

      if (cache.current[key] && !force) {
        setAnalytics(cache.current[key]);
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

        cache.current[key] = payload;
        setAnalytics(payload);
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
    return categories.reduce<Record<string, ExpenseCategoryModel>>((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {});
  }, [categories]);

  return {
    categories,
    categoryLoading,
    refreshCategories,
    analytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,
    categoryLookup,
  };
};
