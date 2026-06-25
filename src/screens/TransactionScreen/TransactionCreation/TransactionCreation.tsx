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
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
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
}

export default React.memo(TransactionCreation);
