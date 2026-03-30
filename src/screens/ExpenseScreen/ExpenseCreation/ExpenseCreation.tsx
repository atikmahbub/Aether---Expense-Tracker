import {View, StyleSheet} from 'react-native';
import React, {
  SetStateAction,
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {Formik} from 'formik';


import {
  EAddExpenseFields,
  CreateExpenseSchema,
} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.constants';
import ExpenseForm from '@trackingPortal/screens/ExpenseScreen/ExpenseForm';
import {INewExpense} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.interfaces';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {IAddExpenseParams} from '@trackingPortal/api/params';
import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {makeUnixTimestampString} from '@trackingPortal/api/primitives';
import Toast from 'react-native-toast-message';
import {ExpenseCategoryModel} from '@trackingPortal/api/models';
import {triggerSuccessHaptic} from '@trackingPortal/utils/haptic';
import {BaseBottomSheet} from '@trackingPortal/components';

interface IExpenseCreation {
  openCreationModal: boolean;
  setOpenCreationModal: React.Dispatch<SetStateAction<boolean>>;
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
  const {apiGateway} = useStoreContext();
  const {user} = useAuth();
  const [loading, setLoading] = useState<boolean>(false);


  const defaultCategoryId = useMemo(() => {
    if (!categories.length) {
      return '';
    }
    const hasRecent =
      lastUsedCategoryId &&
      categories.some(category => category.id === lastUsedCategoryId);
    if (hasRecent && lastUsedCategoryId) {
      return lastUsedCategoryId;
    }
    return categories[0]?.id ?? '';
  }, [categories, lastUsedCategoryId]);



  const handleClose = useCallback(() => {
    setOpenCreationModal(false);
  }, [setOpenCreationModal]);

  const handleAddExpense = useCallback(
    async (values: INewExpense, {resetForm}: any) => {
      if (!user?.sub) return;
      try {
        setLoading(true);
        const trimmedDescription = values.description?.trim();
        const categoryLabel = categories.find(
          item => item.id === values.categoryId,
        )?.name;
        const params: IAddExpenseParams = {
          userId: user.sub as any,
          amount: Number(values.amount),
          date: makeUnixTimestampString(Number(new Date(values.date))),
          description: trimmedDescription || categoryLabel || 'Quick entry',
          categoryId: values.categoryId,
        };
        await apiGateway.expenseService.addExpense(params);

        resetForm({
          values: {
            [EAddExpenseFields.DATE]: new Date(),
            [EAddExpenseFields.DESCRIPTION]: '',
            [EAddExpenseFields.AMOUNT]: '',
            [EAddExpenseFields.CATEGORY_ID]: params.categoryId,
          },
        });

        // Close modal first for better UX
        handleClose();

        // Refresh data after close start
        requestAnimationFrame(async () => {
          await getUserExpenses();
          await refreshAnalytics({force: true});
          triggerSuccessHaptic();
          onCategoryUsed?.(params.categoryId);
          Toast.show({
            type: 'success',
            text1: 'Expense added successfully',
          });
          await getExceedExpenseNotification();
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Something went wrong!',
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
      user?.sub,
    ],
  );

  return (
    <BaseBottomSheet
      index={openCreationModal ? 1 : -1}
      onClose={handleClose}>
      <Formik
        initialValues={{
          [EAddExpenseFields.DATE]: new Date(),
          [EAddExpenseFields.DESCRIPTION]: '',
          [EAddExpenseFields.AMOUNT]: '',
          [EAddExpenseFields.CATEGORY_ID]: defaultCategoryId,
        }}
        onSubmit={handleAddExpense}
        validationSchema={CreateExpenseSchema}>
        {({handleSubmit}) => {
          return (
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
          );
        }}
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
