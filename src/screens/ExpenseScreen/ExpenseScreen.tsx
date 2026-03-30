import { useIsFocused } from "@react-navigation/native";
import { ExpenseModel, MonthlyLimitModel } from "@trackingPortal/api/models";
import {
  Month,
  UnixTimeStampString,
  Year,
} from "@trackingPortal/api/primitives";
import { AnimatedLoader } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import AnalyticsCard from "@trackingPortal/screens/ExpenseScreen/components/AnalyticsCard";
import ExpenseCreation from "@trackingPortal/screens/ExpenseScreen/ExpenseCreation";
import ExpenseList from "@trackingPortal/screens/ExpenseScreen/ExpenseList";
import ExpenseSummary from "@trackingPortal/screens/ExpenseScreen/ExpenseSummary";
import { useDailyExpenseReminder } from "@trackingPortal/screens/ExpenseScreen/hooks/useDailyExpenseReminder";
import { useExpenseInsights } from "@trackingPortal/screens/ExpenseScreen/hooks/useExpenseInsights";
import { useRecentCategories } from "@trackingPortal/screens/ExpenseScreen/hooks/useRecentCategories";
import { colors } from "@trackingPortal/themes/colors";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExpenseScreen() {
  const {
    currentUser: user,
    apiGateway,
    currency,
    isCategoryHydrated,
  } = useStoreContext();

  const activeUserId = user.userId;

  const [openCreationForm, setOpenCreationModal] = useState(false);
  const [isCreationPreloaded, setIsCreationPreloaded] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);

  const visibleData = useMemo(
    () => expenses.slice(0, visibleCount),
    [expenses, visibleCount],
  );
  const [filterMonth, setFilterMonth] = useState(dayjs());
  const [monthLimit, setMonthLimit] = useState<MonthlyLimitModel>(
    {} as MonthlyLimitModel,
  );

  const [combinedLoading, setCombinedLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // 🔥 PRELOAD CREATION UI
  useEffect(() => {
    const id = setTimeout(() => {
      setIsCreationPreloaded(true);
    }, 800);
    return () => clearTimeout(id);
  }, []);

  const {
    categories,
    categoryLoading,
    refreshCategories,
    analytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,
    categoryLookup,
  } = useExpenseInsights({
    userId: activeUserId as any,
    month: filterMonth,
  });

  const {
    recentCategoryIds,
    hydrated: recentHydrated,
    recordRecentCategory: addRecentCategory,
    initializeFromHistory,
  } = useRecentCategories();

  useDailyExpenseReminder();

  const fetchAnalytics = useCallback(
    (options?: { force?: boolean }) => {
      if (!activeUserId || !isCategoryHydrated) return;
      return refreshAnalytics(options);
    },
    [refreshAnalytics, activeUserId, isCategoryHydrated],
  );

  const onRetryAnalytics = useCallback(() => {
    refreshAnalytics({ force: true });
  }, [refreshAnalytics]);

  const handleNotifyRowOpen = useCallback(() => {}, []);
  const handleExceedNotification = useCallback(() => {}, []);

  const getExpenses = useCallback(async () => {
    if (!user.userId) return;

    setLoading(true);

    try {
      const response = await apiGateway.expenseService.getExpenseByUser({
        userId: user.userId,
        date: dayjs(filterMonth).unix() as unknown as UnixTimeStampString,
      });

      setExpenses(response);
    } catch (error) {
      console.log("expense error", error);
    } finally {
      setLoading(false);
      setCombinedLoading(false);
    }
  }, [user.userId, apiGateway.expenseService, filterMonth]);

  const getMonthlyLimit = useCallback(async () => {
    if (!user.userId) return;

    setLimitLoading(true);

    try {
      const response =
        await apiGateway.monthlyLimitService.getMonthlyLimitByUserId({
          userId: user.userId,
          month: (dayjs(filterMonth).month() + 1) as Month,
          year: dayjs(filterMonth).year() as Year,
        });

      setMonthLimit(response);
    } catch (error) {
      console.log("limit error", error);
    } finally {
      setLimitLoading(false);
    }
  }, [user.userId, apiGateway.monthlyLimitService, filterMonth]);

  const loadData = useCallback(async () => {
    // Reset page count on filter/user change
    setVisibleCount(12);
    // Only essentials first
    await Promise.all([getMonthlyLimit(), fetchAnalytics()]);

    requestAnimationFrame(() => {
      getExpenses();
    });
  }, [getMonthlyLimit, fetchAnalytics, getExpenses]);

  // 🔥 OPEN MODAL EVENT
  useEffect(() => {
    const listener = () => {
      if (isFocused) {
        setOpenCreationModal(true);
      }
    };

    eventEmitter.on(EVENTS.OPEN_CREATION_MODAL, listener);

    return () => {
      eventEmitter.off(EVENTS.OPEN_CREATION_MODAL, listener);
    };
  }, [isFocused]);

  // 🔥 LOAD DATA (ON MOUNT) - Balanced hydration
  useEffect(() => {
    if (activeUserId && !user.default) {
      const rafId = requestAnimationFrame(() => {
        setCombinedLoading(true);
        loadData();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [activeUserId, user.default, filterMonth, loadData]);

  // 🔥 ENSURE ANALYTICS LOADS AFTER CATEGORY HYDRATION
  useEffect(() => {
    if (!isCategoryHydrated || analyticsLoading) return;
    
    // Defer to next frame to avoid UI blocking
    requestAnimationFrame(() => {
      refreshAnalytics();
    });
  }, [isCategoryHydrated, refreshAnalytics]);

  // 🔥 INIT RECENT CATEGORIES
  useEffect(() => {
    if (!recentHydrated || recentCategoryIds.length || !expenses.length) return;

    const historyIds = expenses
      .map((e) => e.categoryId)
      .filter((id): id is string => !!id);

    initializeFromHistory(historyIds);
  }, [expenses, initializeFromHistory, recentCategoryIds, recentHydrated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCombinedLoading(true);

    await Promise.all([
      loadData(),
      fetchAnalytics({ force: true }),
      refreshCategories({ force: true }),
    ]);

    setRefreshing(false);
  }, [loadData, fetchAnalytics, refreshCategories]);

  const totalExpense = useMemo(
    () => expenses.reduce((acc, crr) => acc + crr.amount, 0),
    [expenses]
  );

  const headerComponent = useMemo(() => (
    <View>
      <ExpenseSummary
        totalExpense={analytics?.totalExpense ?? 0}
        filterMonth={filterMonth}
        monthLimit={monthLimit}
        getMonthlyLimit={getMonthlyLimit}
      />

      <AnalyticsCard
        analytics={analytics}
        monthlyLimit={monthLimit?.limit}
        categories={categoryLookup}
        loading={analyticsLoading || !isCategoryHydrated}
        error={analyticsError}
        onRetry={onRetryAnalytics}
        currency={currency}
      />
    </View>
  ), [filterMonth, monthLimit, getMonthlyLimit, analytics, categoryLookup, analyticsLoading, isCategoryHydrated, analyticsError, onRetryAnalytics, currency]);

  const footerComponent = useMemo(() => (
    <ExpenseList
      filteredMonth={filterMonth}
      setFilteredMonth={setFilterMonth}
      expenses={visibleData}
      getUserExpenses={getExpenses}
      categories={categories}
      categoriesLoading={categoryLoading}
      refreshCategories={refreshCategories}
      refreshAnalytics={fetchAnalytics}
      recentCategoryIds={recentCategoryIds}
      onCategoryUsed={addRecentCategory}
      notifyRowOpen={handleNotifyRowOpen}
    />
  ), [filterMonth, setFilterMonth, visibleData, getExpenses, categories, categoryLoading, refreshCategories, fetchAnalytics, recentCategoryIds, addRecentCategory, handleNotifyRowOpen]);

  // 🔥 MAIN LOADER FIX - DISABLED FOR DEBUGGING
  if (
    (combinedLoading || loading || limitLoading || !isCategoryHydrated) &&
    expenses.length === 0
  ) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isNearBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 200;

          if (isNearBottom && visibleCount < expenses.length) {
            setVisibleCount((prev) => prev + 10);
          }
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {headerComponent}
        {footerComponent}
      </ScrollView>

      {(openCreationForm || isCreationPreloaded) && (
        <ExpenseCreation
          openCreationModal={openCreationForm}
          setOpenCreationModal={setOpenCreationModal}
          getUserExpenses={getExpenses}
          getExceedExpenseNotification={handleExceedNotification}
          categories={categories}
          categoriesLoading={categoryLoading}
          refreshCategories={refreshCategories}
          refreshAnalytics={fetchAnalytics}
          recentCategoryIds={recentCategoryIds}
          lastUsedCategoryId={recentCategoryIds[0] || null}
          onCategoryUsed={addRecentCategory}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingTop: 10,
  },
});
