import { ExpenseModel, MonthlyLimitModel } from "@trackingPortal/api/models";
import {
  Month,
  UnixTimeStampString,
  Year,
} from "@trackingPortal/api/primitives";
import { AnimatedLoader } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import ExpenseCreation from "@trackingPortal/screens/ExpenseScreen/ExpenseCreation";
import ExpenseList from "@trackingPortal/screens/ExpenseScreen/ExpenseList";
import ExpenseSummary from "@trackingPortal/screens/ExpenseScreen/ExpenseSummary";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { AnimatedFAB } from "react-native-paper";
import Toast from "react-native-toast-message";

import AnalyticsCard from "@trackingPortal/screens/ExpenseScreen/components/AnalyticsCard";
import { useDailyExpenseReminder } from "@trackingPortal/screens/ExpenseScreen/hooks/useDailyExpenseReminder";
import { useExpenseInsights } from "@trackingPortal/screens/ExpenseScreen/hooks/useExpenseInsights";
import { useRecentCategories } from "@trackingPortal/screens/ExpenseScreen/hooks/useRecentCategories";
import { colors } from "@trackingPortal/themes/colors";
import { withHaptic } from "@trackingPortal/utils/haptic";

export default function ExpenseScreen() {
  const { currentUser: user, apiGateway, currency } = useStoreContext();
  const activeUserId = user.default ? undefined : user.userId;
  const [hideFabIcon, setHideFabIcon] = useState<boolean>(false);
  const [openCreationForm, setOpenCreationModal] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [filterMonth, setFilterMonth] = useState(dayjs(new Date()));
  const [monthLimit, setMonthLimit] = useState<MonthlyLimitModel>(
    {} as MonthlyLimitModel,
  );
  const [combinedLoading, setCombinedLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [limitLoading, setLimitLoading] = useState<boolean>(false);
  const [creationCooldown, setCreationCooldown] = useState(false);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCreationOpen = useRef(openCreationForm);
  const {
    categories,
    categoryLoading,
    categoryError,
    refreshCategories,
    analytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,
    categoryLookup,
  } = useExpenseInsights({ userId: activeUserId, month: filterMonth });
  const {
    hydrated: recentHydrated,
    recentCategoryIds,
    lastUsedCategoryId,
    recordRecentCategory,
    initializeFromHistory,
  } = useRecentCategories();

  useDailyExpenseReminder();

  const fetchAnalytics = useCallback(
    (options?: { force?: boolean }) => {
      if (!activeUserId) {
        return;
      }
      return refreshAnalytics(options);
    },
    [refreshAnalytics, activeUserId],
  );

  useEffect(() => {
    if (user.userId && !user.default) {
      loadData();
    }
  }, [user, filterMonth]);

  useEffect(() => {
    if (!recentHydrated || recentCategoryIds.length || !expenses.length) {
      return;
    }
    const ordered = [...expenses]
      .sort((a, b) => Number(b.date) - Number(a.date))
      .map((item) => item.categoryId)
      .filter((id): id is string => Boolean(id));
    initializeFromHistory(ordered);
  }, [expenses, initializeFromHistory, recentCategoryIds, recentHydrated]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (prevCreationOpen.current && !openCreationForm) {
      setCreationCooldown(true);
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
      cooldownTimeoutRef.current = setTimeout(() => {
        setCreationCooldown(false);
        cooldownTimeoutRef.current = null;
      }, 350);
    }
    prevCreationOpen.current = openCreationForm;
  }, [openCreationForm]);

  useEffect(
    () => () => {
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    },
    [],
  );

  const loadData = async () => {
    try {
      await Promise.all([getExpenses(), getMonthlyLimit()]);
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setCombinedLoading(false);
    }
  };

  const getExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiGateway.expenseService.getExpenseByUser({
        userId: user.userId,
        date: dayjs(filterMonth).unix() as unknown as UnixTimeStampString,
      });
      setExpenses(response);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
      });
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyLimit = async () => {
    try {
      setLimitLoading(true);
      const monthlyLimit =
        await apiGateway.monthlyLimitService.getMonthlyLimitByUserId({
          userId: user.userId,
          month: (filterMonth.month() + 1) as Month,
          year: filterMonth.year() as Year,
        });
      setMonthLimit(monthlyLimit);
    } catch (error) {
      console.log(error);
    } finally {
      setLimitLoading(false);
    }
  };

  const getExceedExpenseNotification = async () => {
    if (!user.userId) return;
    try {
      const response =
        await apiGateway.expenseService.exceedExpenseNotification(user.userId);
      if (response) {
        //notification sent
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const totalExpense = expenses.reduce((acc, crr): number => {
    acc += crr.amount;
    return acc;
  }, 0);

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

  if (combinedLoading || loading || limitLoading) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item, index) => `${item.id || index}`}
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
              onRetry={() => fetchAnalytics({ force: true })}
              currency={currency}
            />
          </View>
        }
        ListFooterComponent={
          <ExpenseList
            notifyRowOpen={(value) => setHideFabIcon(value)}
            filteredMonth={filterMonth}
            setFilteredMonth={setFilterMonth}
            expenses={expenses}
            getUserExpenses={getExpenses}
            categories={categories}
            categoriesLoading={categoryLoading}
            categoryError={categoryError}
            refreshCategories={() => refreshCategories({ force: true })}
            refreshAnalytics={fetchAnalytics}
            recentCategoryIds={recentCategoryIds}
            onCategoryUsed={recordRecentCategory}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={null}
        contentContainerStyle={styles.listContent}
      />
      <ExpenseCreation
        openCreationModal={openCreationForm}
        setOpenCreationModal={setOpenCreationModal}
        getUserExpenses={getExpenses}
        getExceedExpenseNotification={getExceedExpenseNotification}
        categories={categories}
        categoriesLoading={categoryLoading}
        categoryError={categoryError}
        refreshCategories={() => refreshCategories({ force: true })}
        refreshAnalytics={fetchAnalytics}
        recentCategoryIds={recentCategoryIds}
        lastUsedCategoryId={lastUsedCategoryId}
        onCategoryUsed={recordRecentCategory}
      />
      <AnimatedFAB
        extended={false}
        visible={!hideFabIcon && !openCreationForm}
        icon={"plus"}
        animateFrom={"right"}
        iconMode={"static"}
        label="Add New"
        color={colors.background}
        style={styles.fabStyle}
        onPress={() => {
          if (openCreationForm || creationCooldown) {
            return;
          }
          withHaptic(() => {
            setOpenCreationModal(true);
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fabStyle: {
    bottom: 3,
    right: 24,
    position: "absolute",
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  listContent: {
    paddingBottom: 180,
    paddingTop: 8,
  },
});
