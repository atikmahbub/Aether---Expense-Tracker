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
  useMemo,
  useState,
} from 'react';
import {Button, Text} from 'react-native-paper';
import dayjs, {Dayjs} from 'dayjs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DatePicker from 'react-native-date-picker';
import DataTable from '@trackingPortal/components/DataTable';
import {colors} from '@trackingPortal/themes/colors';
import {Formik} from 'formik';
import {
  CreateTransactionSchema,
  EAddTransactionFields,
} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import TransactionForm from '@trackingPortal/screens/TransactionScreen/TransactionForm';
import {ExpenseCategoryModel, TransactionModel, TransactionModelV1} from '@trackingPortal/api/models';
import {
  TransactionId,
  makeUnixTimestampString,
  makeUnixTimestampToNumber,
} from '@trackingPortal/api/primitives';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {useNetwork} from '@trackingPortal/contexts/NetworkProvider';
import {IUpdateTransactionParams} from '@trackingPortal/api/params';
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
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [openPicker, setOpenPicker] = useState<boolean>(false);

  const {currentUser: user, apiGateway, currency} = useStoreContext();
  const {isOnline} = useNetwork();
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

  const openYearPicker = useCallback(() => {
    setOpenPicker(true);
  }, []);

  const onTransactionEdit = useCallback(async (
    values: any,
    {resetForm}: any,
    id: TransactionId,
  ) => {
    if (user.default) return;

    // 🌐 Network guard
    if (!isOnline) {
      Toast.show({
        type: 'offline',
        text1: 'No internet connection',
        text2: 'Please check your connection and try again.',
      });
      return;
    }

    try {
      setLoading(true);
      const categoryName =
        (values.categoryId && categoryLookup[values.categoryId]?.name) || '';
      const description =
        values.description?.trim() || categoryName || 'Quick entry';
      
      const payload: any = {
        amount: Number(values.amount),
        date: makeUnixTimestampString(Number(new Date(values.date))),
        description,
        categoryId: values.categoryId,
      };

      if (typeFilter === 'income') {
        await apiGateway.transactionService.updateIncome(id, payload);
      } else {
        await apiGateway.transactionService.updateExpense(id, payload);
      }

      resetForm();
      setExpandedRowId(null);

      InteractionManager.runAfterInteractions(async () => {
        await getUserExpenses();
        await refreshAnalytics({force: true});
        await refreshSummary?.();
        triggerSuccessHaptic();
        if (payload.categoryId) {
          onCategoryUsed?.(payload.categoryId);
        }
        Toast.show({
          type: 'success',
          text1: 'Updated successfully!',
        });
      });
    } catch (error: any) {
      console.log('Update error', error);
      let message = 'Failed to update. Please try again.';
      if (error.response) {
        const status = error.response.status;
        if (status === 400) message = 'Invalid data provided.';
        else if (status === 401) message = 'Session expired.';
        else if (status === 404) message = 'Entry not found.';
      }
      Toast.show({
        type: 'error',
        text1: message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    apiGateway.transactionService,
    categoryLookup,
    getUserExpenses,
    isOnline,
    onCategoryUsed,
    refreshAnalytics,
    typeFilter,
    user.default,
  ]);

  const handleDeleteTransaction = useCallback(async (rowId: any) => {
    if (!rowId) return;

    // 🌐 Network guard
    if (!isOnline) {
      Toast.show({
        type: 'offline',
        text1: 'No internet connection',
        text2: 'Cannot delete while offline.',
      });
      return;
    }

    try {
      setDeleteLoading(true);
      if (typeFilter === 'income') {
        await apiGateway.transactionService.deleteIncome(rowId);
      } else {
        await apiGateway.transactionService.deleteExpense(rowId);
      }

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
      });
    } catch (error: any) {
      console.log('Delete error', error);
      let message = 'Failed to delete. Please try again.';
      if (error.response) {
        const status = error.response.status;
        if (status === 401) message = 'Session expired.';
        else if (status === 404) message = 'Entry already deleted or not found.';
      }
      Toast.show({
        type: 'error',
        text1: message,
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [
    apiGateway.transactionService,
    getUserExpenses,
    isOnline,
    refreshAnalytics,
    typeFilter,
    refreshSummary,
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

const styles = StyleSheet.create({
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
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
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
    marginTop: 12,
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
