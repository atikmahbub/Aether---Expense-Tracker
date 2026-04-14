import dayjs from 'dayjs';
import { Formik } from 'formik';
import React, {
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View, Pressable, Text, InteractionManager, Keyboard } from 'react-native';
import { IconButton } from 'react-native-paper';

import { ExpenseCategoryModel, TransactionModel, TransactionModelV1 } from '@trackingPortal/api/models';
import { IAddTransactionParams } from '@trackingPortal/api/params';
import { makeUnixTimestampString, TransactionId, UserId } from '@trackingPortal/api/primitives';
import { useAuth } from '@trackingPortal/auth/Auth0ProviderWithHistory';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useNetwork } from '@trackingPortal/contexts/NetworkProvider';
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import {
  CreateTransactionSchema,
  EAddTransactionFields,
} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import { INewTransaction } from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.interfaces';
import TransactionForm from '@trackingPortal/screens/TransactionScreen/TransactionForm';
import { triggerSuccessHaptic } from '@trackingPortal/utils/haptic';
import { colors } from '@trackingPortal/themes/colors';
import Toast from 'react-native-toast-message';

interface ITransactionCreation {
  openCreationModal: boolean;
  setOpenCreationModal: React.Dispatch<SetStateAction<boolean>>;
  initialType?: 'Expense' | 'Income';
  setTransactions: React.Dispatch<SetStateAction<TransactionModel[]>>;
  getUserExpenses: () => void;
  getExceedExpenseNotification: () => void;
  categories: ExpenseCategoryModel[];
  incomeCategories: ExpenseCategoryModel[];
  categoriesLoading: boolean;
  incomeCategoriesLoading: boolean;
  categoryError?: string | null;
  refreshCategories: () => Promise<void> | void;
  refreshAnalytics: (options?: {force?: boolean}) => Promise<void> | void;
  recentCategoryIds: string[];
  lastUsedCategoryId: string | null;
  onCategoryUsed?: (categoryId: string) => void;
  refreshSummary?: () => Promise<void> | void;
}

const TransactionCreation: React.FC<ITransactionCreation> = ({
  openCreationModal,
  setOpenCreationModal,
  initialType = 'Expense',
  setTransactions,
  getUserExpenses,
  getExceedExpenseNotification,
  categories,
  incomeCategories,
  categoriesLoading,
  incomeCategoriesLoading,
  categoryError,
  refreshCategories,
  refreshAnalytics,
  recentCategoryIds,
  lastUsedCategoryId,
  onCategoryUsed,
  refreshSummary,
}) => {
  const { apiGateway } = useStoreContext();
  const { user } = useAuth();
  const { isOnline, saveOffline } = useOffline();
  const [loading, setLoading] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'Expense' | 'Income'>(
    initialType,
  );

  React.useEffect(() => {
    setTransactionType(initialType);
  }, [initialType]);

  const activeCategories = useMemo(() => 
    transactionType === 'Expense' ? categories : incomeCategories,
  [transactionType, categories, incomeCategories]);

  const activeLoading = transactionType === 'Expense' ? categoriesLoading : incomeCategoriesLoading;

  const defaultCategoryId = useMemo(() => {
    if (lastUsedCategoryId && activeCategories.some(c => c.id === lastUsedCategoryId)) {
      return lastUsedCategoryId;
    }
    return activeCategories.length > 0 ? activeCategories[0].id : '';
  }, [lastUsedCategoryId, activeCategories]);

  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddTransaction = useCallback(
    async (values: INewTransaction, { resetForm }: any) => {
      if (!user?.sub) return;

      if (!isOnline) {
        try {
          setLoading(true);
          const trimmedDescription = values.description?.trim();
          const categoryLabel = activeCategories.find(
            item => item.id === values.categoryId,
          )?.name;

          const safeDate = dayjs(values.date)
            .hour(12)
            .minute(0)
            .second(0)
            .millisecond(0)
            .toDate();

          const params: IAddTransactionParams = {
            userId: user.sub as any,
            amount: Number(values.amount),
            date: makeUnixTimestampString(Number(safeDate)),
            description: trimmedDescription || categoryLabel || 'Quick entry',
            categoryId: values.categoryId,
            type: transactionType.toLowerCase() as 'expense' | 'income',
          };

          const offlineItem = await saveOffline('transaction', params);
          
          // ✅ Optimistic update for offline
          const mockTransaction: TransactionModel = {
            id: String(offlineItem.id),
            type: params.type || 'expense',
            amount: Number(values.amount),
            date: safeDate.toISOString(),
            description: trimmedDescription || categoryLabel || 'Quick entry',
            category: {
              name: activeCategories.find(c => c.id === values.categoryId)?.name || 'Other',
              icon: activeCategories.find(c => c.id === values.categoryId)?.icon || 'receipt',
              color: activeCategories.find(c => c.id === values.categoryId)?.color || colors.subText,
            }
          };

          setTransactions(prev => [mockTransaction, ...prev]);
          handleClose();
          resetForm();
          return;
        } catch (error) {
          console.error('Offline Transaction Error:', error);
        } finally {
          setLoading(false);
        }
      }
      try {
        setLoading(true);

        const trimmedDescription = values.description?.trim();
        const categoryLabel = activeCategories.find(
          item => item.id === values.categoryId,
        )?.name;

        // ✅ FIXED timezone-safe date
        const safeDate = dayjs(values.date)
          .hour(12)
          .minute(0)
          .second(0)
          .millisecond(0)
          .toDate();

        const params: any = {
          userId: user.sub as any,
          amount: Number(values.amount),
          date: makeUnixTimestampString(Number(safeDate)),
          description: trimmedDescription || categoryLabel || 'Quick entry',
          categoryId: values.categoryId,
        };

        let newTransaction: TransactionModelV1;
        if (transactionType.toLowerCase() === 'income') {
          newTransaction = await apiGateway.transactionService.addIncome(params);
        } else {
          newTransaction = await apiGateway.transactionService.addExpense(params);
        }

        // ✅ OPTIMISTIC UI UPDATE
        const mockTransaction: TransactionModel = {
          id: newTransaction.id,
          amount: Number(newTransaction.amount),
          date: newTransaction.date,
          description: newTransaction.description || trimmedDescription || 'Quick entry',
          type: transactionType.toLowerCase() as 'expense' | 'income',
          category: {
            name: activeCategories.find(c => c.id === values.categoryId)?.name || newTransaction.categoryName || 'Other',
            icon: activeCategories.find(c => c.id === values.categoryId)?.icon || 'receipt',
            color: activeCategories.find(c => c.id === values.categoryId)?.color || colors.subText,
          }
        };
        setTransactions(prev => [mockTransaction, ...prev]);

        resetForm({
          values: {
            [EAddTransactionFields.DATE]: new Date(),
            [EAddTransactionFields.DESCRIPTION]: '',
            [EAddTransactionFields.AMOUNT]: '',
            [EAddTransactionFields.CATEGORY_ID]: values.categoryId,
          },
        });

        // Close modal first for smooth UX
        handleClose();

        // 1. Refresh everything else
        requestAnimationFrame(async () => {
          await getUserExpenses();
          await refreshAnalytics({ force: true });
          await refreshSummary?.();
          
          triggerSuccessHaptic();
          onCategoryUsed?.(params.categoryId);

          Toast.show({
            type: 'success',
            text1: `${transactionType} added successfully`,
          });

          await getExceedExpenseNotification();
        });
      } catch (error: any) {
        console.error('Transaction Creation Error:', error);
        
        let message = 'Failed to add transaction. Please try again.';
        
        // Handle axios/network errors
        if (error.response) {
          const status = error.response.status;
          if (status === 400) {
            message = 'Invalid data provided. Please check your entries.';
          } else if (status === 401) {
            message = 'Session expired. Please log in again.';
          } else if (status === 404) {
            message = 'Service endpoint not found.';
          } else if (error.response.data?.message) {
            message = error.response.data.message;
          }
        }

        Toast.show({
          type: 'error',
          text1: message,
        });
      } finally {
        setLoading(false);
      }
    },
    [
      apiGateway.transactionService,
      categories,
      getExceedExpenseNotification,
      getUserExpenses,
      handleClose,
      onCategoryUsed,
      refreshAnalytics,
      setTransactions,
      isOnline,
      saveOffline,
      transactionType,
    ],
  );

  return (
    <BaseBottomSheet index={openCreationModal ? 1 : -1} onClose={handleClose}>
      <Formik
        initialValues={{
          [EAddTransactionFields.DATE]: new Date(),
          [EAddTransactionFields.DESCRIPTION]: '',
          [EAddTransactionFields.AMOUNT]: '',
          [EAddTransactionFields.CATEGORY_ID]: defaultCategoryId,
        }}
        onSubmit={handleAddTransaction}
        validationSchema={CreateTransactionSchema}
      >
        {({ handleSubmit, isValid, dirty }) => (
          <View style={styles.container}>
            <View style={styles.modalToggleRow}>
              <View style={styles.segmentedToggle}>
                <Pressable
                  onPress={() => setTransactionType('Expense')}
                  style={({ pressed }) => [
                    styles.toggleButton,
                    (transactionType === 'Expense' || pressed) && styles.toggleButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.toggleText,
                      transactionType === 'Expense' && styles.toggleTextActive,
                    ]}>
                    Expense
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTransactionType('Income')}
                  style={({ pressed }) => [
                    styles.toggleButton,
                    (transactionType === 'Income' || pressed) && styles.toggleButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.toggleText,
                      transactionType === 'Income' && styles.toggleTextActive,
                    ]}>
                    Income
                  </Text>
                </Pressable>
              </View>
            </View>

            <TransactionForm
              categories={activeCategories}
              categoriesLoading={activeLoading}
              categoryError={categoryError}
              refreshCategories={refreshCategories}
              recentCategoryIds={recentCategoryIds}
              defaultCategoryId={defaultCategoryId}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              loading={loading}
            />
          </View>
        )}
      </Formik>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalToggleRow: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
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
  topHeader: {
    position: 'absolute',
    top: 5,
    right: 8,
    zIndex: 10,
  },
  checkIcon: {
    margin: 0,
  },
});

export default React.memo(TransactionCreation);