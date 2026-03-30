import {
  View,
  StyleSheet,
  TouchableOpacity,
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

import DatePicker from 'react-native-date-picker';
import DataTable from '@trackingPortal/components/DataTable';
import {colors} from '@trackingPortal/themes/colors';
import {Formik} from 'formik';
import {
  CreateExpenseSchema,
  EAddExpenseFields,
} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.constants';
import ExpenseForm from '@trackingPortal/screens/ExpenseScreen/ExpenseForm';
import {ExpenseCategoryModel, ExpenseModel} from '@trackingPortal/api/models';
import {
  ExpenseId,
  makeUnixTimestampString,
  makeUnixTimestampToNumber,
} from '@trackingPortal/api/primitives';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {useNetwork} from '@trackingPortal/contexts/NetworkProvider';
import {IUpdateExpenseParams} from '@trackingPortal/api/params';
import Toast from 'react-native-toast-message';
import {AnimatedLoader, LoadingButton} from '@trackingPortal/components';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '@trackingPortal/utils/haptic';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {normalizeCategoryIcon} from '@trackingPortal/screens/ExpenseScreen/ExpenseScreen.constants';

interface IExpenseList {
  notifyRowOpen: (value: boolean) => void;
  setFilteredMonth: React.Dispatch<SetStateAction<Dayjs>>;
  filteredMonth: Dayjs;
  expenses: ExpenseModel[];
  setExpenses: React.Dispatch<SetStateAction<ExpenseModel[]>>;
  getUserExpenses: () => void;
  categories: ExpenseCategoryModel[];
  categoriesLoading: boolean;
  categoryError?: string | null;
  refreshCategories: () => Promise<void> | void;
  refreshAnalytics: (options?: {force?: boolean}) => Promise<void> | void;
  recentCategoryIds: string[];
  onCategoryUsed?: (categoryId: string) => void;
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

const ExpenseList: FC<IExpenseList> = ({
  notifyRowOpen,
  setFilteredMonth,
  filteredMonth,
  expenses,
  setExpenses,
  getUserExpenses,
  categories,
  categoriesLoading,
  categoryError,
  refreshCategories,
  refreshAnalytics,
  recentCategoryIds,
  onCategoryUsed,
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

  const onExpenseEdit = async (
    values: any,
    {resetForm}: any,
    id: ExpenseId,
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
      const params: IUpdateExpenseParams = {
        id: id,
        amount: Number(values.amount),
        date: makeUnixTimestampString(Number(new Date(values.date))),
        description,
        categoryId: values.categoryId,
      };
      const updatedExpense = await apiGateway.expenseService.updateExpense(params);

      // ✅ OPTIMISTIC UPDATE
      setExpenses(prev => prev.map(item => item.id === id ? updatedExpense : item));

      resetForm();
      setExpandedRowId(null);

      requestAnimationFrame(async () => {
        await getUserExpenses();
        await refreshAnalytics({force: true});
        triggerSuccessHaptic();
        if (params.categoryId) {
          onCategoryUsed?.(params.categoryId);
        }
        Toast.show({
          type: 'success',
          text1: 'Expense updated successfully!',
        });
      });
    } catch (error) {
      console.log('error', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (rowId: any) => {
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
      await apiGateway.expenseService.deleteExpense(rowId);

      // ✅ OPTIMISTIC DELETE
      setExpenses(prev => prev.filter(item => item.id !== rowId));

      setExpandedRowId(null);

      requestAnimationFrame(async () => {
        await getUserExpenses();
        await refreshAnalytics({force: true});
        triggerWarningHaptic();
        Toast.show({
          type: 'success',
          text1: 'Deleted Successfully!',
        });
      });
    } catch (error) {
      console.log('error', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete. Please try again.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderCollapsibleContent = useCallback(
    (item: ExpenseModel) => {
      const selectedItem = expenses.find(expense => expense.id === item.id);
      if (!selectedItem) return null;
      const currentRowId = selectedItem.id;

      return (
        <Formik
          enableReinitialize
          initialValues={{
            id: selectedItem.id,
            [EAddExpenseFields.DATE]: new Date(
              Number(selectedItem.date) * 1000,
            ),
            [EAddExpenseFields.DESCRIPTION]: selectedItem.description || '',
            [EAddExpenseFields.AMOUNT]: formatNumber(selectedItem.amount, {
              useGrouping: false,
              maximumFractionDigits: 2,
            }),
            [EAddExpenseFields.CATEGORY_ID]: selectedItem.categoryId || '',
          }}
          onSubmit={(values, formikHelpers) =>
            onExpenseEdit(values, formikHelpers, currentRowId)
          }
          validationSchema={CreateExpenseSchema}>
          {({handleSubmit}) => (
            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.collapsibleContent}>
              <ExpenseForm
                categories={categories}
                categoriesLoading={categoriesLoading}
                categoryError={categoryError}
                refreshCategories={refreshCategories}
                recentCategoryIds={recentCategoryIds}
                onSubmit={handleSubmit}
                onCancel={() => setExpandedRowId(null)}
                loading={loading}
              />
            </KeyboardAwareScrollView>
          )}
        </Formik>
      );
    },
    [
      expenses,
      setExpandedRowId,
      categories,
      categoriesLoading,
      categoryError,
      refreshCategories,
      recentCategoryIds,
    ],
  );

  if (deleteLoading) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.listCard}>
        <View style={styles.timelineRow}>
          <Text style={styles.title}>Timeline</Text>
          <Button
            mode="contained-tonal"
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
            data={expenses.map(item => {
              const category = item.categoryId
                ? categoryLookup[item.categoryId]
                : undefined;
              const fallbackName = category?.name || 'Uncategorized';
              const normalizedIcon = normalizeCategoryIcon(category?.icon);
              const formattedAmount = formatCurrency(item.amount, currency);

              return {
                id: item.id,
                Date: dayjs(
                  makeUnixTimestampToNumber(Number(item.date)),
                ).format('MMM D, YYYY'),
                Purpose: item.description || fallbackName,
                Amount: item.amount,
                DisplayAmount: formattedAmount,
                CategoryName: fallbackName,
                CategoryColor: category?.color,
                IconName: normalizedIcon,
                IconColor: category?.color,
                IconBackground: tintFromHex(category?.color, 0.16),
              };
            })}
            onDelete={handleDeleteExpense}
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
        <TouchableOpacity
          style={styles.yearPickerOverlay}
          activeOpacity={1}
          onPress={() => setOpenPicker(false)}>
          <View style={styles.yearPickerContent}>
            <Text style={styles.yearPickerTitle}>Select Year</Text>
            <View style={{maxHeight: 240}}>
              <ScrollView>
                {Array.from({length: 10}, (_, i) => dayjs().year() + 2 - i).map(
                  yr => (
                    <TouchableOpacity
                      key={yr}
                      style={styles.yearOption}
                      onPress={() => {
                        setFilteredMonth(filteredMonth.year(yr));
                        setOpenPicker(false);
                        // Trigger API fetch implicitly through the useEffect on filteredMonth in ExpenseScreen
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
                    </TouchableOpacity>
                  ),
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default React.memo(ExpenseList);

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flex: 1,
  },
  listCard: {
    marginTop: 12,
  },
  chipsScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  chip: {
    borderColor: colors.glassBorder,
    borderRadius: 999,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(161, 250, 255, 0.08)',
  },
  chipLabel: {
    color: colors.subText,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  chipLabelActive: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  monthButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
  },
  monthButtonLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
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
