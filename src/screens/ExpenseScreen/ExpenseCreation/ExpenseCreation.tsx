import dayjs from 'dayjs';
import { Formik } from 'formik';
import React, {
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { ExpenseCategoryModel, ExpenseModel } from '@trackingPortal/api/models';
import { IAddExpenseParams } from '@trackingPortal/api/params';
import { makeUnixTimestampString } from '@trackingPortal/api/primitives';
import { useAuth } from '@trackingPortal/auth/Auth0ProviderWithHistory';
import { BaseBottomSheet } from '@trackingPortal/components';
import { useNetwork } from '@trackingPortal/contexts/NetworkProvider';
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import {
  CreateExpenseSchema,
  EAddExpenseFields,
} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.constants';
import { INewExpense } from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.interfaces';
import ExpenseForm from '@trackingPortal/screens/ExpenseScreen/ExpenseForm';
import { triggerSuccessHaptic } from '@trackingPortal/utils/haptic';
import Toast from 'react-native-toast-message';

interface IExpenseCreation {
  openCreationModal: boolean;
  setOpenCreationModal: React.Dispatch<SetStateAction<boolean>>;
  setExpenses: React.Dispatch<SetStateAction<ExpenseModel[]>>;
  getUserExpenses: () => void;
  getExceedExpenseNotification: () => void;
  categories: ExpenseCategoryModel[];
  categoriesLoading: boolean;
  categoryError?: string | null;
  refreshCategories: () => Promise<void> | void;
  refreshAnalytics: (options?: {force?: boolean}) => Promise<void> | void;
  recentCategoryIds: string[];
  lastUsedCategoryId: string | null;
  onCategoryUsed?: (categoryId: string) => void;
}

const ExpenseCreation: React.FC<IExpenseCreation> = ({
  openCreationModal,
  setOpenCreationModal,
  setExpenses,
  getUserExpenses,
  getExceedExpenseNotification,
  categories,
  categoriesLoading,
  categoryError,
  refreshCategories,
  refreshAnalytics,
  recentCategoryIds,
  lastUsedCategoryId,
  onCategoryUsed,
}) => {
  const { apiGateway } = useStoreContext();
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [loading, setLoading] = useState<boolean>(false);

  const defaultCategoryId = useMemo(() => {
    if (!categories.length) return '';

    const hasRecent =
      lastUsedCategoryId &&
      categories.some(category => category.id === lastUsedCategoryId);

    if (hasRecent && lastUsedCategoryId) return lastUsedCategoryId;

    return categories[0]?.id ?? '';
  }, [categories, lastUsedCategoryId]);

  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddExpense = useCallback(
    async (values: INewExpense, { resetForm }: any) => {
      if (!user?.sub) return;

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

        const trimmedDescription = values.description?.trim();
        const categoryLabel = categories.find(
          item => item.id === values.categoryId,
        )?.name;

        // ✅ FIXED timezone-safe date
        const safeDate = dayjs(values.date)
          .hour(12)
          .minute(0)
          .second(0)
          .millisecond(0)
          .toDate();

        const params: IAddExpenseParams = {
          userId: user.sub as any,
          amount: Number(values.amount),
          date: makeUnixTimestampString(Number(safeDate)),
          description: trimmedDescription || categoryLabel || 'Quick entry',
          categoryId: values.categoryId,
        };

        const newExpense = await apiGateway.expenseService.addExpense(params);

        // ✅ OPTIMISTIC UI UPDATE (Option A)
        setExpenses(prev => [newExpense, ...prev]);

        resetForm({
          values: {
            [EAddExpenseFields.DATE]: new Date(),
            [EAddExpenseFields.DESCRIPTION]: '',
            [EAddExpenseFields.AMOUNT]: '',
            [EAddExpenseFields.CATEGORY_ID]: params.categoryId,
          },
        });

        // Close modal first for smooth UX
        handleClose();

        // 1. Refresh everything else
        requestAnimationFrame(async () => {
          await getUserExpenses();
          await refreshAnalytics({ force: true });
          
          triggerSuccessHaptic();
          onCategoryUsed?.(params.categoryId);

          Toast.show({
            type: 'success',
            text1: 'Expense added successfully',
          });

          await getExceedExpenseNotification();
        });
      } catch (error) {
        console.error('Expense Creation Error:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to add expense. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    },
    [
      apiGateway.expenseService,
      categories,
      getExceedExpenseNotification,
      getUserExpenses,
      handleClose,
      onCategoryUsed,
      refreshAnalytics,
      setExpenses,
      user?.sub,
    ],
  );

  return (
    <BaseBottomSheet index={openCreationModal ? 1 : -1} onClose={handleClose}>
      <Formik
        initialValues={{
          [EAddExpenseFields.DATE]: new Date(),
          [EAddExpenseFields.DESCRIPTION]: '',
          [EAddExpenseFields.AMOUNT]: '',
          [EAddExpenseFields.CATEGORY_ID]: defaultCategoryId,
        }}
        onSubmit={handleAddExpense}
        validationSchema={CreateExpenseSchema}
      >
        {({ handleSubmit }) => (
          <View style={styles.container}>
            <ExpenseForm
              categories={categories}
              categoriesLoading={categoriesLoading}
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
});

export default React.memo(ExpenseCreation);