import dayjs from 'dayjs';
import { Formik } from 'formik';
import React, {
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { ExpenseCategoryModel, TransactionModel } from '@trackingPortal/api/models';
import { useAuth } from '@trackingPortal/auth/Auth0ProviderWithHistory';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useOffline } from '@trackingPortal/contexts/OfflineProvider';
import { useDatabase } from '@trackingPortal/db/DatabaseProvider';
import { TransactionDataService } from '@trackingPortal/db/services/TransactionDataService';
import {
  CreateTransactionSchema,
  EAddTransactionFields,
} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import { INewTransaction } from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.interfaces';
import TransactionForm from '@trackingPortal/screens/TransactionScreen/TransactionForm';
import { triggerSuccessHaptic } from '@trackingPortal/utils/haptic';
import Toast from 'react-native-toast-message';
import TransactionSegmentedControl from '@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl';
import { designTokens } from '@trackingPortal/themes/designTokens';

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
  const { transactionData } = useDatabase();
  const { user } = useAuth();
  const { syncNow } = useOffline();
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
      if (!user?.sub || !transactionData) return;

      try {
        setLoading(true);

        const trimmedDescription = values.description?.trim();
        const categoryLabel = activeCategories.find(
          item => item.id === values.categoryId,
        )?.name;
        const description = trimmedDescription || categoryLabel || 'Quick entry';
        const date = TransactionDataService.toTimestamp(dayjs(values.date).toDate());
        const type = transactionType.toLowerCase() as 'expense' | 'income';

        // Offline-first: write to SQLite immediately (works online or offline).
        const created = await transactionData.createTransaction({
          userId: user.sub as string,
          amount: Number(values.amount),
          description,
          date,
          categoryId: values.categoryId,
          type,
        });

        triggerSuccessHaptic();
        setTransactions(prev => [created, ...prev]);

        resetForm({
          values: {
            [EAddTransactionFields.DATE]: new Date(),
            [EAddTransactionFields.DESCRIPTION]: '',
            [EAddTransactionFields.AMOUNT]: '',
            [EAddTransactionFields.CATEGORY_ID]: values.categoryId,
          },
        });

        handleClose();

        requestAnimationFrame(async () => {
          await getUserExpenses();
          await refreshAnalytics({ force: true });
          await refreshSummary?.();

          onCategoryUsed?.(values.categoryId);

          Toast.show({
            type: 'success',
            text1: `${transactionType} added successfully`,
          });

          await getExceedExpenseNotification();

          // Push to the cloud now if online; a no-op (queued) when offline.
          syncNow();
        });
      } catch (error: any) {
        console.error('Transaction Creation Error:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to add transaction. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    },
    [
      transactionData,
      user?.sub,
      activeCategories,
      getExceedExpenseNotification,
      getUserExpenses,
      handleClose,
      onCategoryUsed,
      refreshAnalytics,
      refreshSummary,
      setTransactions,
      syncNow,
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
        {({ handleSubmit }) => (
          <View style={styles.container}>
            <TransactionSegmentedControl
              options={['Expense', 'Income']}
              selectedOption={transactionType}
              onOptionPress={option =>
                setTransactionType(option as 'Expense' | 'Income')
              }
            />

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
              showShortcutKeypad
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
    gap: designTokens.spacing.md,
  },
});

export default React.memo(TransactionCreation);
