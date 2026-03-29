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
import { withHaptic } from "@trackingPortal/utils/haptic";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  InteractionManager,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExpenseScreen() {
  const { currentUser: user, apiGateway, currency } = useStoreContext();
  const activeUserId = user.userId;
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
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

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
  } = useExpenseInsights({ userId: activeUserId as any, month: filterMonth });

  const {
    recentCategoryIds,
    hydrated: recentHydrated,
    recordRecentCategory: addRecentCategory,
    initializeFromHistory,
  } = useRecentCategories();

  useDailyExpenseReminder();

  const handleOpenCreationModal = useCallback(() => {
    if (openCreationForm || creationCooldown) {
      return;
    }
    withHaptic(() => {
      InteractionManager.runAfterInteractions(() => setOpenCreationModal(true));
    });
  }, [openCreationForm, creationCooldown]);

  useEffect(() => {
    const listener = () => {
      if (isFocused) {
        handleOpenCreationModal();
      }
    };
    eventEmitter.on(EVENTS.OPEN_CREATION_MODAL, listener);
    return () => {
      eventEmitter.off(EVENTS.OPEN_CREATION_MODAL, listener);
    };
  }, [isFocused, handleOpenCreationModal]);

  useEffect(() => {
    if (user.userId && !user.default) {
      loadData();
    }
  }, [user, filterMonth]);

  useEffect(() => {
    if (!recentHydrated || recentCategoryIds.length || !expenses.length) {
      return;
    }
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

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getExpenses = async () => {
    if (!user.userId) {
      return;
    }
    setLoading(true);
    try {
      const response = await apiGateway.expenseService.getExpenseByUser({
        userId: user.userId,
        date: dayjs(filterMonth).unix() as unknown as UnixTimeStampString,
      });
      setExpenses(response);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
      setCombinedLoading(false);
    }
  };

  const getMonthlyLimit = async () => {
    if (!user.userId) {
      return;
    }
    setLimitLoading(true);
    try {
      const response = await apiGateway.monthlyLimitService.getMonthlyLimitByUserId({
        userId: user.userId,
        month: (dayjs(filterMonth).month() + 1) as Month,
        year: dayjs(filterMonth).year() as Year,
      });
      setMonthLimit(response);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLimitLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([getExpenses(), getMonthlyLimit()]);
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

  const totalExpense = expenses.reduce((acc, crr): number => {
    acc += crr.amount;
    return acc;
  }, 0);

  if (combinedLoading || loading || limitLoading) {
    if (expenses.length === 0) {
      return <AnimatedLoader />;
    }
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
            refreshCategories={refreshCategories}
            refreshAnalytics={fetchAnalytics}
            recentCategoryIds={recentCategoryIds}
            onCategoryUsed={addRecentCategory}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      <ExpenseCreation
        openCreationModal={openCreationForm}
        setOpenCreationModal={setOpenCreationModal}
        getUserExpenses={getExpenses}
        getExceedExpenseNotification={() => {}}
        categories={categories}
        categoriesLoading={categoryLoading}
        categoryError={categoryError}
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
