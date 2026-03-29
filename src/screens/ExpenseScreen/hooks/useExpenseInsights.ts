import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dayjs, {Dayjs} from 'dayjs';
import {
  ExpenseAnalyticsModel,
  ExpenseCategoryModel,
} from '@trackingPortal/api/models';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {
  FALLBACK_CATEGORIES,
  normalizeCategoryIcon,
} from '@trackingPortal/screens/ExpenseScreen/ExpenseScreen.constants';
import {UnixTimeStampString} from '@trackingPortal/api/primitives';

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
  const {apiGateway} = useStoreContext();
  const [categories, setCategories] =
    useState<ExpenseCategoryModel[]>(FALLBACK_CATEGORIES);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const categoriesCache = useRef<ExpenseCategoryModel[] | null>(null);

  const [analytics, setAnalytics] = useState<ExpenseAnalyticsModel | null>(
    null,
  );
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const analyticsCache = useRef<Record<string, ExpenseAnalyticsModel>>({});

  const PRIORITY_ORDER = ['Groceries', 'Food', 'Kids', 'Health'];

  const hydrateCategories = useCallback((payload: ExpenseCategoryModel[]) => {
    const normalized = payload.map(category => ({
      ...category,
      icon: normalizeCategoryIcon(category.icon),
    }));

    return normalized.sort((a, b) => {
      const indexA = PRIORITY_ORDER.indexOf(a.name);
      const indexB = PRIORITY_ORDER.indexOf(b.name);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return 0;
    });
  }, []);

  const refreshCategories = useCallback(
    async ({force}: RefreshOptions = {}) => {
      if (categoriesCache.current && !force) {
        setCategories(categoriesCache.current);
        return;
      }
      setCategoryLoading(true);
      setCategoryError(null);
      try {
        const response = await apiGateway.expenseService.getCategories();
        const normalized = hydrateCategories(response);
        categoriesCache.current = normalized;
        setCategories(normalized);
      } catch (error) {
        console.log('Failed to fetch categories', error);
        setCategoryError('Unable to load categories');
        if (!categoriesCache.current) {
          categoriesCache.current = FALLBACK_CATEGORIES;
          setCategories(FALLBACK_CATEGORIES);
        }
      } finally {
        setCategoryLoading(false);
      }
    },
    [apiGateway, hydrateCategories],
  );

  const refreshAnalytics = useCallback(
    async ({force}: RefreshOptions = {}) => {
      if (!userId || !month) {
        setAnalytics(null);
        return;
      }

      const monthKey = dayjs(month).format('YYYY-MM');
      const cacheKey = `${userId}-${monthKey}`;

      if (analyticsCache.current[cacheKey] && !force) {
        setAnalytics(analyticsCache.current[cacheKey]);
        return;
      }

      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const payload = await apiGateway.expenseService.getExpenseAnalytics({
          userId,
          date: dayjs(month)
            .startOf('month')
            .unix() as unknown as UnixTimeStampString,
        });
        analyticsCache.current[cacheKey] = payload;
        setAnalytics(payload);
      } catch (error) {
        console.log('Failed to fetch analytics', error);
        setAnalyticsError('Unable to load analytics');
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
    refreshCategories();
  }, [refreshCategories]);

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
    categoryError,
    refreshCategories,
    analytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,
    categoryLookup,
  } as const;
};
