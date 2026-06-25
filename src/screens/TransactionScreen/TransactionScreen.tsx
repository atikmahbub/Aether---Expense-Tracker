import { useIsFocused } from "@react-navigation/native";
import {
  MonthlyLimitModel,
  TransactionModel,
} from "@trackingPortal/api/models";
import { TransactionSummaryModel } from "@trackingPortal/api/models/TransactionSummaryModel";
import { Month, Year } from "@trackingPortal/api/primitives";
import { AnimatedLoader } from "@trackingPortal/components";
import { useNetwork } from "@trackingPortal/contexts/NetworkProvider";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import AnalyticsCard from "@trackingPortal/screens/TransactionScreen/components/AnalyticsCard";
import TransactionSegmentedControl from "@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl";
import { useRecentCategories } from "@trackingPortal/screens/TransactionScreen/hooks/useRecentCategories";
import { useTransactionInsights } from "@trackingPortal/screens/TransactionScreen/hooks/useTransactionInsights";
import TransactionCreation from "@trackingPortal/screens/TransactionScreen/TransactionCreation";
import TransactionList from "@trackingPortal/screens/TransactionScreen/TransactionList";
import TransactionSummary from "@trackingPortal/screens/TransactionScreen/TransactionSummary";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import dayjs from "dayjs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  InteractionManager,
  RefreshControl,
  Animated as RNAnimated,
  StyleSheet,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const AnimatedKeyboardAwareScrollView = RNAnimated.createAnimatedComponent(
  KeyboardAwareScrollView,
);

export default function TransactionScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    currentUser: user,
    apiGateway,
    currency,
    isCategoryHydrated,
  } = useStoreContext();
  const { transactionData } = useDatabase();

  const activeUserId = user.userId;

  const [openCreationForm, setOpenCreationModal] = useState(false);
  const [isCreationPreloaded, setIsCreationPreloaded] = useState(false);
  const [transactions, setTransactions] = useState<TransactionModel[]>([]);
  const [typeFilter, setTypeFilter] = useState<"expense" | "income">("expense");
  const [visibleCount, setVisibleCount] = useState(12);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => t.type?.toLowerCase() === typeFilter);
  }, [transactions, typeFilter]);

  const handleTypeFilterChange = useCallback((option: string) => {
    setVisibleCount(12);
    InteractionManager.runAfterInteractions(() => {
      setTypeFilter(option as "expense" | "income");
    });
  }, []);

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
    if (!activeUserId || !transactionData) return;
    setLoadingSummary(true);
    try {
      const data = await transactionData.getSummary(activeUserId, filterMonth);
      setSummary(data);
    } catch (error) {
      console.log("Summary fetch failed", error);
    } finally {
      setLoadingSummary(false);
    }
  }, [activeUserId, transactionData, filterMonth]);

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
    if (!user.userId || !transactionData) return;

    setLoading(true);

    try {
      // Offline-first: read the month's transactions straight from SQLite.
      // Cloud changes land in SQLite via the background sync engine.
      const localTransactions = await transactionData.getMonthTransactions(
        user.userId,
        filterMonth,
      );
      setTransactions(localTransactions);
    } catch (error) {
      console.log("transaction error", error);
    } finally {
      setLoading(false);
    }
  }, [user.userId, transactionData, filterMonth]);

  const getMonthlyLimit = useCallback(async () => {
    if (!user.userId) return;
    // Monthly limit is still API-backed; offline we skip it so it can't block
    // the initial load with a 15s network timeout (the rest reads from SQLite).
    if (!isOnline) {
      setLimitLoading(false);
      return;
    }

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
  }, [user.userId, apiGateway.monthlyLimitService, filterMonth, isOnline]);

  const loadData = useCallback(
    async (options?: { force?: boolean }) => {
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
    },
    [getMonthlyLimit, fetchAnalytics, getTransactions, fetchSummary],
  );

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
      loadData({ force: true });
    }
  }, [activeUserId, user.default, isCategoryHydrated, filterMonth, loadData]);

  useEffect(() => {
    if (
      !recentHydrated ||
      recentCategoryIds.length ||
      !transactions.length ||
      !categories.length
    )
      return;

    const historyIds = transactions
      .filter((t) => t.type === "expense" && t.category?.name)
      .map((t) => {
        const cat = categories.find((c) => c.name === t.category.name);
        return cat?.id;
      })
      .filter((id): id is string => !!id);

    initializeFromHistory(historyIds);
  }, [
    transactions,
    initializeFromHistory,
    recentCategoryIds,
    recentHydrated,
    categories,
  ]);

  const onRefresh = useCallback(async () => {
    if (!isOnline) {
      Toast.show({
        type: "offline",
        text1: "No internet connection",
        text2: "Please connect to refresh data.",
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
    return typeFilter === "expense"
      ? summary.totalExpense
      : summary.totalIncome;
  }, [summary, loadingSummary, typeFilter]);

  const crossTabTotal = useMemo(() => {
    if (loadingSummary || !summary) return 0;
    return typeFilter === "expense"
      ? summary.totalIncome
      : summary.totalExpense;
  }, [summary, loadingSummary, typeFilter]);

  const activeTrend = useMemo(() => {
    if (loadingSummary || !summary) return null;
    const value =
      typeFilter === "expense"
        ? summary.expenseChangePercentage
        : summary.incomeChangePercentage;
    const isIncrease = value > 0;
    const isDecrease = value < 0;
    const isBetter = typeFilter === "expense" ? isDecrease : isIncrease;

    return {
      percent: Math.abs(value),
      isLower: value < 0,
      label:
        value === 0
          ? "0% vs last month"
          : `${isIncrease ? "↑" : "↓"} ${Math.abs(value)}% vs last month`,
      color:
        value === 0 ? colors.subText : isBetter ? colors.primary : colors.error,
      icon: isIncrease
        ? "arrow-top-right"
        : isDecrease
          ? "arrow-bottom-right"
          : "minus",
    };
  }, [summary, loadingSummary, typeFilter, colors]);

  const headerComponent = useMemo(
    () => (
      <View>
        <View style={styles.topToggleRow}>
          <TransactionSegmentedControl
            options={["expense", "income"]}
            selectedOption={typeFilter}
            onOptionPress={handleTypeFilterChange}
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
          analytics={
            typeFilter === "expense" ? expenseAnalytics : incomeAnalytics
          }
          monthlyLimit={
            typeFilter === "expense" ? monthLimit?.limit : undefined
          }
          categories={categoryLookup}
          loading={analyticsLoading || !isCategoryHydrated}
          error={analyticsError}
          onRetry={onRetryAnalytics}
          currency={currency}
          mode={typeFilter}
          trend={activeTrend}
          trendLoading={loadingSummary}
          totalSpent={totalDisplayValue ?? 0}
          transactions={filteredTransactions}
        />
      </View>
    ),
    [
      typeFilter,
      totalDisplayValue,
      crossTabTotal,
      activeTrend,
      loadingSummary,
      filterMonth,
      monthLimit,
      getMonthlyLimit,
      expenseAnalytics,
      incomeAnalytics,
      categoryLookup,
      analyticsLoading,
      isCategoryHydrated,
      analyticsError,
      onRetryAnalytics,
      currency,
      styles,
    ],
  );

  const footerComponent = useMemo(
    () => (
      <TransactionList
        filteredMonth={filterMonth}
        setFilteredMonth={setFilterMonth}
        transactions={visibleData}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        getUserExpenses={getTransactions}
        categories={typeFilter === "expense" ? categories : incomeCategories}
        categoriesLoading={
          typeFilter === "expense" ? categoryLoading : incomeCategoryLoading
        }
        refreshCategories={refreshCategories}
        refreshAnalytics={fetchAnalytics}
        recentCategoryIds={recentCategoryIds}
        onCategoryUsed={addRecentCategory}
        notifyRowOpen={handleNotifyRowOpen}
        refreshSummary={fetchSummary}
      />
    ),
    [
      filterMonth,
      setFilterMonth,
      visibleData,
      getTransactions,
      categories,
      categoryLoading,
      refreshCategories,
      fetchAnalytics,
      recentCategoryIds,
      addRecentCategory,
      handleNotifyRowOpen,
      fetchSummary,
    ],
  );

  if (
    (combinedLoading ||
      loading ||
      limitLoading ||
      !isCategoryHydrated ||
      user.default) &&
    transactions.length === 0
  ) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <AnimatedKeyboardAwareScrollView
        enableOnAndroid={true}
        extraScrollHeight={40}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        decelerationRate="normal"
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (event: any) => {
              const { layoutMeasurement, contentOffset, contentSize } =
                event.nativeEvent;
              const isNearBottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 200;

              if (isNearBottom && visibleCount < filteredTransactions.length) {
                setVisibleCount((prev) => prev + 10);
              }
            },
          },
        )}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120, flexGrow: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <RNAnimated.View
          style={{
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [-100, 0, 100],
                  outputRange: [50, 0, -20],
                  extrapolate: "clamp",
                }),
              },
            ],
            opacity: scrollY.interpolate({
              inputRange: [0, 150],
              outputRange: [1, 0.9],
              extrapolate: "clamp",
            }),
          }}
        >
          {headerComponent}
        </RNAnimated.View>
        {footerComponent}
      </AnimatedKeyboardAwareScrollView>

      {(openCreationForm || isCreationPreloaded) && (
        <TransactionCreation
          openCreationModal={openCreationForm}
          setOpenCreationModal={setOpenCreationModal}
          initialType={typeFilter === "expense" ? "Expense" : "Income"}
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

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingTop: 8,
    },
    topToggleRow: {
      paddingHorizontal: 16,
      marginBottom: 8,
      alignItems: "flex-end",
    },
    segmentedToggle: {
      flexDirection: "row",
      backgroundColor: colors.surfaceAlt,
      borderRadius: 8,
      padding: 2,
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    toggleText: {
      color: colors.subText,
      fontSize: 14,
      fontWeight: "600",
    },
    toggleTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
  });
}
