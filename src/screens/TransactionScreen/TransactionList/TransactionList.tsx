import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  InteractionManager,
} from 'react-native';
import React, {
  FC,
  Fragment,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Dimensions} from 'react-native';
const {width: SCREEN_WIDTH} = Dimensions.get('window');
import {Button, Text} from 'react-native-paper';
import dayjs, {Dayjs} from 'dayjs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DatePicker from 'react-native-date-picker';
import DataTable from '@trackingPortal/components/DataTable';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import {Formik} from 'formik';
import {
  CreateTransactionSchema,
  EAddTransactionFields,
} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import TransactionForm from '@trackingPortal/screens/TransactionScreen/TransactionForm';
import {ExpenseCategoryModel, TransactionModel, TransactionModelV1} from '@trackingPortal/api/models';
import {
  TransactionId,
} from '@trackingPortal/api/primitives';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {useOffline} from '@trackingPortal/contexts/OfflineProvider';
import {useDatabase} from '@trackingPortal/db/DatabaseProvider';
import {TransactionDataService} from '@trackingPortal/db/services/TransactionDataService';
import Toast from 'react-native-toast-message';
import {AnimatedLoader, LoadingButton} from '@trackingPortal/components';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '@trackingPortal/utils/haptic';
import {normalizeCategoryIcon} from '@trackingPortal/screens/TransactionScreen/TransactionScreen.constants';
import {parseDate} from '@trackingPortal/utils/date';

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

const headers = ['Date', 'Purpose', 'Amount'];

const tintFromHex = (hex?: string, alpha = 0.12) => {
  if (!hex) {
    return `rgba(255,255,255,${alpha})`;
  }
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
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

  const handleDateConfirm = useCallback(
    (selectedDate: Date) => {
      setOpenPicker(false);
      if (selectedDate) {
        setFilteredMonth(dayjs(selectedDate).startOf('month'));
      }
    },
    [setFilteredMonth],
  );

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
      onTransactionEdit,
      typeFilter,
    ],
  );

  const tableData = useMemo(() => {
    return transactions.map(item => {
      const formattedAmount = formatCurrency(item.amount, currency);

      return {
        id: item.id,
        Date: dayjs(parseDate(item.date)).format('MMM D, YYYY'),
        Purpose: item.description,
        Amount: item.amount,
        DisplayAmount: formattedAmount,
        CategoryName: item.category?.name || 'Uncategorized',
        CategoryColor: item.category?.color,
        IconName: normalizeCategoryIcon(item.category?.icon),
        IconColor: item.category?.color,
        IconBackground: tintFromHex(item.category?.color, 0.16),
        IsIncome: item.type === 'income',
      };
    });
  }, [transactions, currency]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.listCard}>
        <View style={styles.timelineRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
            <Text style={styles.title}>Timeline</Text>
          </View>

          <Button
            mode="text"
            icon="chevron-down"
            contentStyle={{flexDirection: 'row-reverse'}}
            uppercase={false}
            style={styles.monthButton}
            labelStyle={styles.monthButtonLabel}
            onPress={openYearPicker}>
            {dayjs(filteredMonth).format('YYYY')}
          </Button>
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
                <Button
                  key={idx}
                  mode="outlined"
                  compact
                  contentStyle={{ paddingHorizontal: 0, height: 40 }}
                  style={[styles.chip, isActive && styles.chipActive]}
                  labelStyle={
                    isActive ? styles.chipLabelActive : styles.chipLabel
                  }
                  onPress={() =>
                    setFilteredMonth(dayjs(filteredMonth).month(m.month()))
                  }>
                  {m.format('MMM').toUpperCase()}
                </Button>
              );
            },
          )}
        </ScrollView>
        <View style={styles.tableContainer}>
          <DataTable
            headers={headers}
            data={tableData}
            onDelete={handleDeleteTransaction}
            isAnyRowOpen={notifyRowOpen}
            expandedRowId={expandedRowId}
            setExpandedRowId={setExpandedRowId}
            renderCollapsibleContent={renderCollapsibleContent}
          />
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
      paddingTop: 20,
      flex: 1,
    },
    listCard: {
      marginTop: 0,
    },
    chipsScroll: {
      flexGrow: 0,
      marginBottom: 12,
    },
    timelineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 20,
    },
    chip: {
      borderColor: colors.glassBorder,
      borderRadius: 14,
      height: 42,
      backgroundColor: colors.surface,
      borderWidth: 1,
      width: 75,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chipLabel: {
      color: colors.subText,
      fontSize: 11,
      fontWeight: '700',
      fontFamily: 'Manrope',
      letterSpacing: 0.5,
    },
    chipLabelActive: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      fontFamily: 'Manrope',
      letterSpacing: 0.5,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      fontFamily: 'Manrope',
      letterSpacing: -0.5,
    },
    viewAllText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    monthButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: 4,
    },
    monthButtonLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: 'Manrope',
    },
    tableContainer: {
      marginTop: 4,
    },
    collapsibleContent: {
      gap: 16,
      paddingBottom: 20,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
      paddingBottom: 20,
      gap: 10,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    cancelButtonText: {
      color: colors.subText,
      fontWeight: '600',
    },
    yearPickerOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    yearPickerContent: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 24,
      padding: 24,
      width: 240,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    yearPickerTitle: {
      color: colors.text,
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
      color: colors.subText,
      fontSize: 18,
      fontWeight: '500',
    },
    yearOptionTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
  });
}
