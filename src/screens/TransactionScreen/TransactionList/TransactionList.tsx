import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  InteractionManager,
  Text,
Dimensions} from 'react-native';
import React, {
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dayjs, {Dayjs} from 'dayjs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScalarListRow from '@trackingPortal/components/ScalarListRow';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import {Formik} from 'formik';
import {
  CreateTransactionSchema,
  EAddTransactionFields,
} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import TransactionForm from '@trackingPortal/screens/TransactionScreen/TransactionForm';
import {ExpenseCategoryModel, TransactionModel} from '@trackingPortal/api/models';
import {
  TransactionId,
} from '@trackingPortal/api/primitives';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {useOffline} from '@trackingPortal/contexts/OfflineProvider';
import {useDatabase} from '@trackingPortal/db/DatabaseProvider';
import {TransactionDataService} from '@trackingPortal/db/services/TransactionDataService';
import Toast from 'react-native-toast-message';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '@trackingPortal/utils/haptic';
import {normalizeCategoryIcon} from '@trackingPortal/screens/TransactionScreen/TransactionScreen.constants';
import {parseDate} from '@trackingPortal/utils/date';
import {designTokens} from '@trackingPortal/themes/designTokens';
const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface ITransactionList {
  notifyRowOpen: (value: boolean) => void;
  setFilteredMonth: React.Dispatch<SetStateAction<Dayjs>>;
  filteredMonth: Dayjs;
  transactions: TransactionModel[];
  typeFilter: 'expense' | 'income';
  setTypeFilter: (type: 'expense' | 'income') => void;
  getUserExpenses: () => void;
  categories: ExpenseCategoryModel[];
  categoriesLoading: boolean;
  categoryError?: string | null;
  refreshCategories: () => Promise<void> | void;
  refreshAnalytics: (options?: {force?: boolean}) => Promise<void> | void;
  recentCategoryIds: string[];
  onCategoryUsed?: (categoryId: string) => void;
  refreshSummary?: () => Promise<void> | void;
}

const TransactionList: FC<ITransactionList> = ({
  notifyRowOpen,
  setFilteredMonth,
  filteredMonth,
  transactions,
  typeFilter,
  setTypeFilter,
  getUserExpenses,
  categories,
  categoriesLoading,
  categoryError,
  refreshCategories,
  refreshAnalytics,
  recentCategoryIds,
  onCategoryUsed,
  refreshSummary,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);

  const {currentUser: user, currency} = useStoreContext();
  const {transactionData} = useDatabase();
  const {syncNow} = useOffline();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const categoryLookup = useMemo(() => {
    return categories?.reduce<Record<string, ExpenseCategoryModel>>(
      (acc, category) => {
        acc[category.id] = category;
        return acc;
      },
      {},
    );
  }, [categories]);

  const scrollToActiveMonth = useCallback((monthIndex: number, animated = true) => {
    if (!scrollRef.current) return;

    const CHIP_WIDTH = 75;
    const GAP = 8;
    const itemCenter = monthIndex * (CHIP_WIDTH + GAP) + CHIP_WIDTH / 2;
    const scrollX = itemCenter - SCREEN_WIDTH / 2 + 20;

    scrollRef.current.scrollTo({
      x: Math.max(0, scrollX),
      animated,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActiveMonth(filteredMonth.month());
    }, 100);
    return () => clearTimeout(timer);
  }, [filteredMonth, scrollToActiveMonth]);

  const openYearPicker = useCallback(() => {
    setOpenPicker(true);
  }, []);

  const onTransactionEdit = useCallback(async (
    values: any,
    {resetForm}: any,
    id: TransactionId,
  ) => {
    if (user.default || !transactionData) return;

    try {
      setLoading(true);
      const categoryName =
        (values.categoryId && categoryLookup[values.categoryId]?.name) || '';
      const description =
        values.description?.trim() || categoryName || 'Quick entry';

      // Offline-first: update SQLite immediately; sync pushes it when online.
      await transactionData.updateTransaction(id as string, {
        amount: Number(values.amount),
        date: TransactionDataService.toTimestamp(new Date(values.date)),
        description,
        categoryId: values.categoryId,
      });

      resetForm();
      setExpandedRowId(null);

      InteractionManager.runAfterInteractions(async () => {
        await getUserExpenses();
        await refreshAnalytics({force: true});
        await refreshSummary?.();
        triggerSuccessHaptic();
        if (values.categoryId) {
          onCategoryUsed?.(values.categoryId);
        }
        Toast.show({
          type: 'success',
          text1: 'Updated successfully!',
        });
        syncNow();
      });
    } catch (error: any) {
      console.log('Update error', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [
    transactionData,
    categoryLookup,
    getUserExpenses,
    onCategoryUsed,
    refreshAnalytics,
    refreshSummary,
    syncNow,
    user.default,
  ]);

  const handleDeleteTransaction = useCallback(async (rowId: any) => {
    if (!rowId || !transactionData) return;

    try {
      setDeleteLoading(true);
      // Offline-first: soft-delete locally; the remote delete is queued.
      await transactionData.deleteTransaction(rowId as string);

      setExpandedRowId(null);

      InteractionManager.runAfterInteractions(async () => {
        await getUserExpenses();
        await refreshAnalytics({force: true});
        await refreshSummary?.();
        triggerWarningHaptic();
        Toast.show({
          type: 'success',
          text1: 'Deleted successfully!',
        });
        syncNow();
      });
    } catch (error: any) {
      console.log('Delete error', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete. Please try again.',
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [
    transactionData,
    getUserExpenses,
    refreshAnalytics,
    refreshSummary,
    syncNow,
  ]);

  const renderCollapsibleContent = useCallback(
    (item: any) => {
      const selectedItem = transactions.find(t => t.id === item.id);
      if (!selectedItem) return null;
      const currentRowId = selectedItem.id as any as TransactionId;

      return (
        <Formik
          enableReinitialize
          initialValues={{
            id: selectedItem.id,
            [EAddTransactionFields.DATE]: parseDate(selectedItem.date),
            [EAddTransactionFields.DESCRIPTION]: selectedItem.description || '',
            [EAddTransactionFields.AMOUNT]: formatNumber(selectedItem.amount, {
              useGrouping: false,
              maximumFractionDigits: 2,
            }),
            [EAddTransactionFields.CATEGORY_ID]: (selectedItem as any).categoryId || categories.find(c => c.name === selectedItem.category?.name)?.id || '',
          }}
          onSubmit={(values, formikHelpers) =>
            onTransactionEdit(values, formikHelpers, currentRowId)
          }
          validationSchema={CreateTransactionSchema}>
          {({handleSubmit}) => (
            <View style={styles.collapsibleContent}>
              <TransactionForm
                categories={categories}
                categoriesLoading={categoriesLoading}
                categoryError={categoryError}
                refreshCategories={refreshCategories}
                recentCategoryIds={recentCategoryIds}
                onSubmit={handleSubmit}
                onCancel={() => setExpandedRowId(null)}
                loading={loading}
              />
              <Pressable
                disabled={deleteLoading}
                onPress={() => handleDeleteTransaction(currentRowId)}
                style={({pressed}) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}>
                <Text style={styles.deleteButtonText}>
                  {deleteLoading ? 'Deleting…' : 'Delete transaction'}
                </Text>
              </Pressable>
            </View>
          )}
        </Formik>
      );
    },
    [
      transactions,
      setExpandedRowId,
      categories,
      categoriesLoading,
      categoryError,
      refreshCategories,
      recentCategoryIds,
      loading,
      deleteLoading,
      handleDeleteTransaction,
      onTransactionEdit,
      styles,
    ],
  );

  const groupedDays = useMemo(() => {
    const groups = new Map<string, TransactionModel[]>();
    [...transactions]
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
      .forEach(item => {
        const key = dayjs(parseDate(item.date)).format('YYYY-MM-DD');
        groups.set(key, [...(groups.get(key) || []), item]);
      });
    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      items,
      net: items.reduce(
        (sum, item) =>
          sum + (item.type === 'income' ? Math.abs(item.amount) : -Math.abs(item.amount)),
        0,
      ),
    }));
  }, [transactions]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.listCard}>
        <View style={styles.timelineRow}>
          <Text style={styles.title}>Timeline</Text>
          <Pressable
            onPress={openYearPicker}
            style={({pressed}) => [
              styles.yearButton,
              pressed && styles.controlPressed,
            ]}>
            <Text style={styles.yearButtonText}>{filteredMonth.format('YYYY')}</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}>
          {Array.from({length: 12}, (_, i) => dayjs().month(i)).map(
            (m, idx) => {
              const isActive = filteredMonth.month() === m.month();
              return (
                <Pressable
                  key={idx}
                  onPress={() =>
                    setFilteredMonth(dayjs(filteredMonth).month(m.month()))
                  }
                  style={({pressed}) => [
                    styles.chip,
                    isActive && styles.chipActive,
                    pressed && styles.controlPressed,
                  ]}>
                  <Text
                    style={[
                      styles.chipLabel,
                      isActive && styles.chipLabelActive,
                    ]}>
                    {m.format('MMM')}
                  </Text>
                </Pressable>
              );
            },
          )}
        </ScrollView>
        <View style={styles.dayGroups}>
          {groupedDays.map(group => (
            <View key={group.date} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>
                  {dayjs(group.date).format('ddd D MMM').toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.dayNet,
                    group.net > 0 && styles.dayNetPositive,
                  ]}>
                  {`${group.net > 0 ? '+' : '−'}${formatCurrency(
                    Math.abs(group.net),
                    currency,
                    {minimumFractionDigits: 0, maximumFractionDigits: 0},
                  )}`}
                </Text>
              </View>
              <View style={styles.rowsCard}>
                {group.items.map((item, index) => {
                  const category = item.category?.name || 'Uncategorized';
                  const positive = item.type === 'income';
                  const open = expandedRowId === item.id;
                  return (
                    <View key={item.id}>
                      <ScalarListRow
                        title={item.description || category}
                        meta={`${category} · ${dayjs(parseDate(item.date)).format('h:mm a')}`}
                        amount={`${positive ? '+' : '−'}${formatCurrency(
                          Math.abs(item.amount),
                          currency,
                          {minimumFractionDigits: 0, maximumFractionDigits: 0},
                        )}`}
                        positive={positive}
                        icon={normalizeCategoryIcon(item.category?.icon) as any}
                        categoryName={category}
                        categoryColor={item.category?.color}
                        showDivider={index < group.items.length - 1 || open}
                        onPress={() => {
                          const next = open ? null : item.id;
                          setExpandedRowId(next);
                          notifyRowOpen(Boolean(next));
                        }}
                      />
                      {open && renderCollapsibleContent(item)}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          {!groupedDays.length && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No {typeFilter} entries this month</Text>
            </View>
          )}
        </View>
      </View>
      <Modal
        visible={openPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenPicker(false)}>
        <Pressable
          style={styles.yearPickerOverlay}
          onPress={() => setOpenPicker(false)}>
          <View style={styles.yearPickerContent}>
            <Text style={styles.yearPickerTitle}>Select Year</Text>
            <View style={{maxHeight: 240}}>
              <ScrollView>
                {Array.from({length: 10}, (_, i) => dayjs().year() + 2 - i).map(
                  yr => (
                    <Pressable
                      key={yr}
                      style={styles.yearOption}
                      onPress={() => {
                        setFilteredMonth(filteredMonth.year(yr));
                        setOpenPicker(false);
                      }}>
                      <Text
                        style={[
                          styles.yearOptionText,
                          filteredMonth.year() === yr &&
                            styles.yearOptionTextActive,
                        ]}>
                        {formatNumber(yr, {
                          useGrouping: false,
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </Pressable>
                  ),
                )}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default React.memo(TransactionList);

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    mainContainer: {
      paddingHorizontal: 20,
      paddingTop: 28,
      flex: 1,
    },
    listCard: {
      marginTop: 0,
    },
    chipsScroll: {
      flexGrow: 0,
      marginBottom: 16,
    },
    timelineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 20,
    },
    chip: {
      width: 64,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: colors.border,
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
    },
    chipActive: {
      borderColor: colors.brand,
      backgroundColor: colors.brand,
    },
    chipLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: designTokens.font.semibold,
    },
    chipLabelActive: {
      color: colors.onBrand,
      fontWeight: '700',
      fontFamily: designTokens.font.bold,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      fontFamily: designTokens.font.bold,
      letterSpacing: -0.4,
    },
    yearButton: {
      height: 36,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: designTokens.radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    yearButtonText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: designTokens.font.bold,
    },
    controlPressed: {
      backgroundColor: colors.surfaceSunken,
    },
    dayGroups: {
      gap: 20,
    },
    dayGroup: {
      gap: 8,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dayLabel: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontWeight: '700',
      ...designTokens.typography.caps,
    },
    dayNet: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.bold,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    dayNetPositive: {
      color: colors.positive,
    },
    rowsCard: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: designTokens.radius.lg,
      backgroundColor: colors.surface,
    },
    collapsibleContent: {
      gap: 12,
      padding: 16,
      backgroundColor: colors.bg,
    },
    deleteButton: {
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: designTokens.radius.full,
      borderWidth: 1.5,
      borderColor: colors.negative,
    },
    deleteButtonPressed: {
      backgroundColor: colors.surfaceSunken,
    },
    deleteButtonText: {
      color: colors.negative,
      fontFamily: designTokens.font.bold,
      fontSize: 15,
      fontWeight: '700',
    },
    emptyCard: {
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: designTokens.radius.lg,
      backgroundColor: colors.surface,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      textAlign: 'center',
      ...designTokens.typography.body,
    },
    yearPickerOverlay: {
      flex: 1,
      backgroundColor: colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
    },
    yearPickerContent: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: designTokens.radius.lg,
      padding: 24,
      width: 240,
      borderWidth: 1,
      borderColor: colors.border,
    },
    yearPickerTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
      textAlign: 'center',
    },
    yearOption: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    yearOptionText: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '500',
    },
    yearOptionTextActive: {
      color: colors.brandText,
      fontWeight: '700',
    },
  });
}
