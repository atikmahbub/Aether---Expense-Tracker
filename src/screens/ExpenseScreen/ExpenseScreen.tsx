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
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
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
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [filterMonth, setFilterMonth] = useState(dayjs());
  const [monthLimit, setMonthLimit] = useState<MonthlyLimitModel>(
    {} as MonthlyLimitModel,
  );

  const [combinedLoading, setCombinedLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

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

  // 🔥 LOAD DATA (ON MOUNT)
  useEffect(() => {
    if (activeUserId && !user.default) {
      loadData();
    }
  }, [activeUserId, user.default, filterMonth]);

  // 🔥 INIT RECENT CATEGORIES
  useEffect(() => {
    if (!recentHydrated || recentCategoryIds.length || !expenses.length) return;

    const historyIds = expenses
      .map((e) => e.categoryId)
      .filter((id): id is string => !!id);

    initializeFromHistory(historyIds);
  }, [expenses, initializeFromHistory, recentCategoryIds, recentHydrated]);

  const fetchAnalytics = useCallback(
    (options?: { force?: boolean }) => {
      if (!activeUserId) return;
      return refreshAnalytics(options);
    },
    [refreshAnalytics, activeUserId],
  );

  const getExpenses = async () => {
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
  };

  const getMonthlyLimit = async () => {
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
  };

  const loadData = async () => {
    await Promise.all([getExpenses(), getMonthlyLimit(), refreshAnalytics()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCombinedLoading(true);

    await Promise.all([
      loadData(),
      fetchAnalytics({ force: true }),
      refreshCategories({ force: true }),
    ]);

    setRefreshing(false);
  };

  const totalExpense = expenses.reduce((acc, crr) => acc + crr.amount, 0);

  // 🔥 MAIN LOADER FIX
  if (
    (combinedLoading || loading || limitLoading || !isCategoryHydrated) &&
    expenses.length === 0
  ) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item, index) => `${item.id || index}`}
        showsVerticalScrollIndicator={false}
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
        ListHeaderComponent={
          <View>
            <ExpenseSummary
              totalExpense={totalExpense}
              filterMonth={filterMonth}
              monthLimit={monthLimit}
              getMonthlyLimit={getMonthlyLimit}
            />

            <AnalyticsCard
              analytics={analytics}
              monthlyLimit={monthLimit?.limit}
              categories={categoryLookup}
              loading={analyticsLoading}
              error={analyticsError}
              onRetry={() => refreshAnalytics({ force: true })}
              currency={currency}
            />
          </View>
        }
        ListFooterComponent={
          <ExpenseList
            filteredMonth={filterMonth}
            setFilteredMonth={setFilterMonth}
            expenses={expenses}
            getUserExpenses={getExpenses}
            categories={categories}
            categoriesLoading={categoryLoading}
            refreshCategories={refreshCategories}
            refreshAnalytics={fetchAnalytics}
            recentCategoryIds={recentCategoryIds}
            onCategoryUsed={addRecentCategory}
            notifyRowOpen={() => {}}
          />
        }
        renderItem={null}
      />

      <ExpenseCreation
        openCreationModal={openCreationForm}
        setOpenCreationModal={setOpenCreationModal}
        getUserExpenses={getExpenses}
        getExceedExpenseNotification={() => {}}
        categories={categories}
        categoriesLoading={categoryLoading}
        refreshCategories={refreshCategories}
        refreshAnalytics={fetchAnalytics}
        recentCategoryIds={recentCategoryIds}
        lastUsedCategoryId={recentCategoryIds[0] || null}
        onCategoryUsed={addRecentCategory}
      />
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
