import { useIsFocused } from "@react-navigation/native";
import { MonthlyLimitModel, TransactionModel } from "@trackingPortal/api/models";
import { TransactionSummaryModel } from "@trackingPortal/api/models/TransactionSummaryModel";
import {
  Month,
  UnixTimeStampString,
  Year
} from "@trackingPortal/api/primitives";
import { offlineService } from "@trackingPortal/api/utils/OfflineService";
import { AnimatedLoader } from "@trackingPortal/components";
import { useNetwork } from "@trackingPortal/contexts/NetworkProvider";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import AnalyticsCard from "@trackingPortal/screens/TransactionScreen/components/AnalyticsCard";
import TransactionSegmentedControl from "@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl";
import { useRecentCategories } from "@trackingPortal/screens/TransactionScreen/hooks/useRecentCategories";
import { useTransactionInsights } from "@trackingPortal/screens/TransactionScreen/hooks/useTransactionInsights";
import TransactionCreation from "@trackingPortal/screens/TransactionScreen/TransactionCreation";
import TransactionList from "@trackingPortal/screens/TransactionScreen/TransactionList";
import TransactionSummary from "@trackingPortal/screens/TransactionScreen/TransactionSummary";
import { colors } from "@trackingPortal/themes/colors";
import { parseDate } from "@trackingPortal/utils/date";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function TransactionScreen() {
  const {
    currentUser: user,
    apiGateway,
    currency,
    isCategoryHydrated,
  } = useStoreContext();

  const activeUserId = user.userId;

  const [openCreationForm, setOpenCreationModal] = useState(false);
  const [isCreationPreloaded, setIsCreationPreloaded] = useState(false);
  const [transactions, setTransactions] = useState<TransactionModel[]>([]);
  const [typeFilter, setTypeFilter] = useState<'expense' | 'income'>('expense');
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.type?.toLowerCase() === typeFilter);
  }, [transactions, typeFilter]);



  const visibleData = useMemo(
    () => filteredTransactions.slice(0, visibleCount),
    [filteredTransactions, visibleCount],
  );
  const [filterMonth, setFilterMonth] = useState(dayjs());
  const [monthLimit, setMonthLimit] = useState<MonthlyLimitModel>(
    {} as MonthlyLimitModel,
  );

  const [combinedLoading, setCombinedLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);
  const [summary, setSummary] = useState<TransactionSummaryModel | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { isOnline } = useNetwork();
  const wasOfflineRef = useRef(false);

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
    expenseAnalytics,
    incomeAnalytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,
    categoryLookup,
    incomeCategories,
    incomeCategoryLoading,
  } = useTransactionInsights({
    userId: activeUserId as any,
    month: filterMonth,
  });

  const {
    recentCategoryIds,
    hydrated: recentHydrated,
    recordRecentCategory: addRecentCategory,
    initializeFromHistory,
  } = useRecentCategories();

  const fetchSummary = useCallback(async () => {
    if (!activeUserId) return;
    setLoadingSummary(true);
    try {
      const data = await apiGateway.transactionService.getTransactionSummary(user.userId);
      setSummary(data);
    } catch (error) {
      console.log("Summary fetch failed", error);
    } finally {
      setLoadingSummary(false);
    }
  }, [activeUserId, apiGateway, user.userId]);

  // useDailyTransactionReminder();

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

  const getTransactions = useCallback(async () => {
    if (!user.userId) return;

    setLoading(true);

    try {
      // 1. Fetch from server using the new transactions API
      let serverTransactions: TransactionModel[] = [];
      try {
        serverTransactions = await apiGateway.transactionService.getTransactions({
          userId: user.userId,
          date: dayjs(filterMonth).unix() as unknown as UnixTimeStampString,
        });
      } catch (e) {
        console.log("Server Transactions fetch failed", e);
      }

      // 2. Load from offline queue
      const queue = await offlineService.getQueue();
      const currentMonthStr = dayjs(filterMonth).format("YYYY-MM");
      
      const offlineTransactions: TransactionModel[] = queue
        .filter(item => 
          item.type === 'transaction' && 
          !item.synced && 
          dayjs(parseDate(item.payload.date)).format("YYYY-MM") === currentMonthStr
        )
        .map(item => ({
          id: item.id as string,
          type: (item.payload.type || 'expense') as 'expense' | 'income',
          amount: item.payload.amount,
          date: item.payload.date as string,
          description: item.payload.description,
          category: {
            name: (item.payload.type === 'income' ? incomeCategories : categories).find(c => c.id === item.payload.categoryId)?.name || 'Other',
            icon: (item.payload.type === 'income' ? incomeCategories : categories).find(c => c.id === item.payload.categoryId)?.icon || 'receipt',
            color: (item.payload.type === 'income' ? incomeCategories : categories).find(c => c.id === item.payload.categoryId)?.color || colors.subText,
          }
        }));

      setTransactions([...offlineTransactions, ...serverTransactions]);
    } catch (error) {
      console.log("transaction error", error);
    } finally {
      setLoading(false);
      // Removed setCombinedLoading(false) from here to control it in loadData
    }
  }, [user.userId, apiGateway.transactionService, filterMonth, categories]);

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

  const loadData = useCallback(async (options?: { force?: boolean }) => {
    setVisibleCount(12);
    setCombinedLoading(true);
    
    try {
      await Promise.all([
        getMonthlyLimit(), 
        fetchAnalytics(options),
        getTransactions(),
        fetchSummary(),
      ]);
    } finally {
      setCombinedLoading(false);
    }
  }, [getMonthlyLimit, fetchAnalytics, getTransactions, fetchSummary]);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current && isFocused) {
      wasOfflineRef.current = false;
      loadData({ force: true });
      refreshCategories({ force: true });
    }
  }, [isOnline, isFocused, loadData, refreshCategories]);

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

  useEffect(() => {
    const onSyncCompleted = () => {
      loadData({ force: true });
      refreshCategories({ force: true });
    };

    eventEmitter.on(EVENTS.OFFLINE_SYNC_COMPLETED, onSyncCompleted);

    return () => {
      eventEmitter.off(EVENTS.OFFLINE_SYNC_COMPLETED, onSyncCompleted);
    };
  }, [loadData, refreshCategories]);

  useEffect(() => {
    if (activeUserId && !user.default && isCategoryHydrated) {
      const rafId = requestAnimationFrame(() => {
        setCombinedLoading(true);
        loadData({ force: true });
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [activeUserId, user.default, isCategoryHydrated, filterMonth, loadData]);



  useEffect(() => {
    if (!recentHydrated || recentCategoryIds.length || !transactions.length || !categories.length) return;

    const historyIds = transactions
      .filter(t => t.type === 'expense' && t.category?.name)
      .map((t) => {
        const cat = categories.find(c => c.name === t.category.name);
        return cat?.id;
      })
      .filter((id): id is string => !!id);

    initializeFromHistory(historyIds);
  }, [transactions, initializeFromHistory, recentCategoryIds, recentHydrated, categories]);

  const onRefresh = useCallback(async () => {
    if (!isOnline) {
      Toast.show({
        type: 'offline',
        text1: 'No internet connection',
        text2: 'Please connect to refresh data.',
      });
      return;
    }

    setRefreshing(true);
    setCombinedLoading(true);

    await Promise.all([
      loadData(),
      fetchAnalytics({ force: true }),
      refreshCategories({ force: true }),
      fetchSummary(),
    ]);

    setRefreshing(false);
  }, [isOnline, loadData, fetchAnalytics, refreshCategories, fetchSummary]);

  const totalDisplayValue = useMemo(() => {
    if (loadingSummary || !summary) return null;
    return typeFilter === 'expense' ? summary.totalExpense : summary.totalIncome;
  }, [summary, loadingSummary, typeFilter]);

  const crossTabTotal = useMemo(() => {
    if (loadingSummary || !summary) return 0;
    return typeFilter === 'expense' ? summary.totalIncome : summary.totalExpense;
  }, [summary, loadingSummary, typeFilter]);

  const activeTrend = useMemo(() => {
    if (loadingSummary || !summary) return null;
    const value = typeFilter === 'expense' ? summary.expenseChangePercentage : summary.incomeChangePercentage;
    const isIncrease = value > 0;
    const isDecrease = value < 0;

    return {
      percent: Math.abs(value),
      isLower: value < 0,
      label: value === 0 ? "0% vs last month" : `${isIncrease ? "↑" : "↓"} ${Math.abs(value)}% vs last month`,
      color: value === 0 ? colors.subText : (isIncrease ? '#4ADE80' : '#F87171'),
      icon: isIncrease ? 'arrow-top-right' : (isDecrease ? 'arrow-bottom-right' : 'minus'),
    };
  }, [summary, loadingSummary, typeFilter]);

  const headerComponent = useMemo(() => (
    <View>
      <View style={styles.topToggleRow}>
        <TransactionSegmentedControl
          options={['expense', 'income']}
          selectedOption={typeFilter}
          onOptionPress={(option) => setTypeFilter(option as 'expense' | 'income')}
        />
      </View>

      <TransactionSummary
        totalValue={totalDisplayValue ?? 0}
        type={typeFilter}
        monthlyIncome={crossTabTotal}
        filterMonth={filterMonth}
        monthLimit={monthLimit}
        getMonthlyLimit={getMonthlyLimit}
        isLoading={loadingSummary}
      />

      <AnalyticsCard
        analytics={typeFilter === 'expense' ? expenseAnalytics : incomeAnalytics}
        monthlyLimit={typeFilter === 'expense' ? monthLimit?.limit : undefined}
        categories={categoryLookup}
        loading={analyticsLoading || !isCategoryHydrated}
        error={analyticsError}
        onRetry={onRetryAnalytics}
        currency={currency}
        mode={typeFilter}
        trend={activeTrend}
        trendLoading={loadingSummary}
      />
    </View>
  ), [typeFilter, totalDisplayValue, crossTabTotal, activeTrend, loadingSummary, filterMonth, monthLimit, getMonthlyLimit, expenseAnalytics, incomeAnalytics, categoryLookup, analyticsLoading, isCategoryHydrated, analyticsError, onRetryAnalytics, currency]);

  const footerComponent = useMemo(() => (
    <TransactionList
      filteredMonth={filterMonth}
      setFilteredMonth={setFilterMonth}
      transactions={visibleData}
      typeFilter={typeFilter}
      setTypeFilter={setTypeFilter}
      getUserExpenses={getTransactions}
      categories={typeFilter === 'expense' ? categories : incomeCategories}
      categoriesLoading={typeFilter === 'expense' ? categoryLoading : incomeCategoryLoading}
      refreshCategories={refreshCategories}
      refreshAnalytics={fetchAnalytics}
      recentCategoryIds={recentCategoryIds}
      onCategoryUsed={addRecentCategory}
      notifyRowOpen={handleNotifyRowOpen}
      refreshSummary={fetchSummary}
    />
  ), [filterMonth, setFilterMonth, visibleData, getTransactions, categories, categoryLoading, refreshCategories, fetchAnalytics, recentCategoryIds, addRecentCategory, handleNotifyRowOpen, fetchSummary]);

  if (
    (combinedLoading || loading || limitLoading || !isCategoryHydrated || user.default) &&
    transactions.length === 0
  ) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isNearBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 200;

          if (isNearBottom && visibleCount < filteredTransactions.length) {
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
        <TransactionCreation
          openCreationModal={openCreationForm}
          setOpenCreationModal={setOpenCreationModal}
          initialType={typeFilter === 'expense' ? 'Expense' : 'Income'}
          setTransactions={setTransactions}
          getUserExpenses={getTransactions}
          getExceedExpenseNotification={handleExceedNotification}
          categories={categories}
          incomeCategories={incomeCategories}
          categoriesLoading={categoryLoading}
          incomeCategoriesLoading={incomeCategoryLoading}
          refreshCategories={refreshCategories}
          refreshAnalytics={fetchAnalytics}
          recentCategoryIds={recentCategoryIds}
          lastUsedCategoryId={recentCategoryIds[0] || null}
          onCategoryUsed={addRecentCategory}
          refreshSummary={fetchSummary}
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
  topToggleRow: {
    paddingHorizontal: 20,
    marginBottom: 0,
    alignItems: 'flex-end',
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 7,
  },
  toggleButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    color: colors.subText,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
