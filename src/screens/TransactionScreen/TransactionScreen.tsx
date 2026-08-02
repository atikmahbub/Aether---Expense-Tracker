import { useIsFocused } from "@react-navigation/native";
import {
  MonthlyLimitModel,
  TransactionModel,
} from "@trackingPortal/api/models";
import { TransactionSummaryModel } from "@trackingPortal/api/models/TransactionSummaryModel";
import {
  AnimatedLoader,
  FormikTextInput,
} from "@trackingPortal/components";
import FormModal from "@trackingPortal/components/FormModal";
import { useNetwork } from "@trackingPortal/contexts/NetworkProvider";
import { useOffline } from "@trackingPortal/contexts/OfflineProvider";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import HomeDashboard from "@trackingPortal/screens/TransactionScreen/components/HomeDashboard";
import TransactionSegmentedControl from "@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl";
import { useRecentCategories } from "@trackingPortal/screens/TransactionScreen/hooks/useRecentCategories";
import { useTransactionInsights } from "@trackingPortal/screens/TransactionScreen/hooks/useTransactionInsights";
import TransactionCreation from "@trackingPortal/screens/TransactionScreen/TransactionCreation";
import { EMonthlyLimitFields } from "@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants";
import TransactionList from "@trackingPortal/screens/TransactionScreen/TransactionList";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import dayjs from "dayjs";
import { Formik, FormikHelpers } from "formik";
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
import Toast from "react-native-toast-message";

const AnimatedKeyboardAwareScrollView = RNAnimated.createAnimatedComponent(
  KeyboardAwareScrollView,
);

export default function TransactionScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    currentUser: user,
    currency,
    isCategoryHydrated,
  } = useStoreContext();
  const { transactionData, monthlyLimitData } = useDatabase();
  const { syncNow } = useOffline();

  const activeUserId = user.userId;

  const [openCreationForm, setOpenCreationModal] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
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
    refreshAnalytics,
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
    if (!user.userId || !monthlyLimitData) return;

    setLimitLoading(true);

    try {
      // Offline-first: read the limit from SQLite (synced from the cloud).
      const response = await monthlyLimitData.getLimit(
        user.userId,
        dayjs(filterMonth).month() + 1,
        dayjs(filterMonth).year(),
      );
      setMonthLimit(response);
    } catch (error) {
      console.log("limit error", error);
    } finally {
      setLimitLoading(false);
    }
  }, [user.userId, monthlyLimitData, filterMonth]);

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

  // Stale-while-revalidate: keep rendering the last summary while a refetch is
  // in flight. Background syncs re-run fetchSummary; gating these on
  // `loadingSummary` blanked the amounts to "…"/0 on every sync, which read as
  // the digits flickering. Only the very first load (summary === null) shows a
  // placeholder.
  const summaryInitialLoading = loadingSummary && !summary;

  const handleSaveLimit = useCallback(
    async (
      values: Record<EMonthlyLimitFields, string>,
      helpers: FormikHelpers<Record<EMonthlyLimitFields, string>>,
    ) => {
      const numericLimit = Number(values[EMonthlyLimitFields.LIMIT]);
      if (
        !numericLimit ||
        Number.isNaN(numericLimit) ||
        numericLimit <= 0 ||
        !monthlyLimitData ||
        !user.userId
      ) {
        Toast.show({ type: "error", text1: "Enter a valid monthly limit" });
        return;
      }
      try {
        setSavingLimit(true);
        await monthlyLimitData.setLimit(
          user.userId,
          filterMonth.month() + 1,
          filterMonth.year(),
          numericLimit,
        );
        await getMonthlyLimit();
        setLimitModalVisible(false);
        helpers.resetForm();
        Toast.show({
          type: "success",
          text1: monthLimit?.id
            ? "Limit updated successfully"
            : "Limit added successfully",
        });
        syncNow();
      } catch {
        Toast.show({ type: "error", text1: "Something went wrong" });
      } finally {
        setSavingLimit(false);
      }
    },
    [
      filterMonth,
      getMonthlyLimit,
      monthLimit?.id,
      monthlyLimitData,
      syncNow,
      user.userId,
    ],
  );

  const headerComponent = useMemo(
    () => (
      <HomeDashboard
        month={filterMonth}
        type={typeFilter}
        summary={summary}
        monthlyLimit={monthLimit}
        transactions={transactions}
        currency={currency}
        loading={summaryInitialLoading}
        onAdjustLimit={() => setLimitModalVisible(true)}
        ledgerControl={
          <TransactionSegmentedControl
            options={["expense", "income"]}
            selectedOption={typeFilter}
            onOptionPress={handleTypeFilterChange}
          />
        }
      />
    ),
    [
      typeFilter,
      summary,
      summaryInitialLoading,
      filterMonth,
      monthLimit,
      currency,
      transactions,
      handleTypeFilterChange,
    ],
  );

  const footerComponent = useMemo(
    () => (
      <View>
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
      </View>
    ),
    [
      filterMonth,
      setFilterMonth,
      visibleData,
      getTransactions,
      categories,
      categoryLoading,
      incomeCategories,
      incomeCategoryLoading,
      typeFilter,
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
      {/* Every input on this screen lives inside a modal that handles the
          keyboard itself; enableOnAndroid would shift this list too. */}
      <AnimatedKeyboardAwareScrollView
        enableOnAndroid={false}
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
          { paddingBottom: 20, flexGrow: 1 },
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
      <Formik
        enableReinitialize
        initialValues={{
          [EMonthlyLimitFields.LIMIT]: monthLimit?.limit
            ? String(monthLimit.limit)
            : "",
        }}
        onSubmit={handleSaveLimit}
      >
        {({ handleSubmit, resetForm }) => (
          <FormModal
            isVisible={limitModalVisible}
            title={monthLimit?.limit ? "Adjust monthly limit" : "Set monthly limit"}
            subtitle={filterMonth.format("MMMM YYYY")}
            saveLabel={monthLimit?.limit ? "Update limit" : "Set limit"}
            onClose={() => {
              setLimitModalVisible(false);
              resetForm();
            }}
            onSave={handleSubmit}
            loading={savingLimit}
          >
            <FormikTextInput
              autoFocus
              name={EMonthlyLimitFields.LIMIT}
              label="Monthly limit"
              keyboardType="numeric"
            />
          </FormModal>
        )}
      </Formik>
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
      paddingTop: 0,
    },
  });
}
