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
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import { useDatabase } from '@trackingPortal/db/DatabaseProvider';
import { TransactionDataService } from '@trackingPortal/db/services/TransactionDataService';
import {
  CreateTransactionSchema,
  EAddTransactionFields,
  resolveTransactionAmount,
} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import { INewTransaction } from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.interfaces';
import TransactionForm from '@trackingPortal/screens/TransactionScreen/TransactionForm';
import { triggerSuccessHaptic } from '@trackingPortal/utils/haptic';
import Toast from 'react-native-toast-message';
import TransactionSegmentedControl from '@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl';
import type {RepeatChoice} from '@trackingPortal/screens/TransactionScreen/components/RepeatPicker';

import { designTokens } from '@trackingPortal/themes/designTokens';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';
import { useFrequencyText } from '@trackingPortal/i18n/frequency';
import { eventEmitter, EVENTS } from '@trackingPortal/utils/events';

/** Values the Recurring screen's examples open the form with. */
export interface CreationPrefill {
  type: 'Expense' | 'Income';
  description: string;
  repeat: RepeatChoice;
  date: Date;
}

let pendingPrefill: CreationPrefill | null = null;

/**
 * Asks the Transactions screen to open the add form with these values. Held
 * until that screen is focused, since the caller is usually another route.
 */
export function requestCreation(prefill: CreationPrefill) {
  pendingPrefill = prefill;
  eventEmitter.emit(EVENTS.OPEN_CREATION_MODAL);
}

export function takePendingPrefill(): CreationPrefill | null {
  const prefill = pendingPrefill;
  pendingPrefill = null;
  return prefill;
}

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
  prefill?: CreationPrefill | null;
  /** After an entry is added (not for a repeat that starts later). */
  onSaved?: (entry: { type: 'expense' | 'income'; date: Date }) => void;
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
  prefill,
  onSaved,
}) => {
  const { transactionData, recurringData } = useDatabase();
  const { user } = useAuth();
  const { syncNow } = useOffline();
  const { t, formatDate } = useTranslation();
  const { frequencyLabel } = useFrequencyText();
  const [loading, setLoading] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'Expense' | 'Income'>(
    initialType,
  );

  React.useEffect(() => {
    setTransactionType(prefill?.type ?? initialType);
  }, [initialType, prefill]);

  const { hiddenCategoryIds } = useStoreContext();
  // Hidden categories (eye toggle on the Categories screen) stay out of the
  // picker for new entries; existing entries keep theirs.
  const activeCategories = useMemo(() =>
    (transactionType === 'Expense' ? categories : incomeCategories).filter(
      c => !hiddenCategoryIds.includes(c.id),
    ),
  [transactionType, categories, incomeCategories, hiddenCategoryIds]);

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

      const amount = resolveTransactionAmount(values.amount);
      if (amount === null || amount <= 0) return;

      try {
        setLoading(true);

        const trimmedDescription = values.description?.trim();
        const categoryLabel = activeCategories.find(
          item => item.id === values.categoryId,
        )?.name;
        const description = trimmedDescription || categoryLabel || t('form.quickEntry');
        const date = TransactionDataService.toTimestamp(dayjs(values.date).toDate());
        const type = transactionType.toLowerCase() as 'expense' | 'income';

        const repeat = values.repeat ?? 'never';
        const typeLabel = t(transactionType === 'Expense' ? 'wallet.expense' : 'wallet.income');
        let toastText = t('form.added', { type: typeLabel });
        let entryAdded = true;
        if (repeat !== 'never' && recurringData) {
          // A repeating entry is a rule; the run below adds any occurrence
          // already due (today's included) as an ordinary transaction.
          await recurringData.createRule({
            userId: user.sub as string,
            type,
            amount,
            description,
            categoryId: values.categoryId,
            frequency: repeat,
            startDate: date,
            endDate: values.repeatEnd
              ? TransactionDataService.toTimestamp(
                  dayjs(values.repeatEnd).endOf('day').toDate(),
                )
              : null,
          });
          const added = await recurringData.runDue(user.sub as string);
          entryAdded = Boolean(added);
          toastText = added
            ? t('form.addedRepeats', {
                type: typeLabel,
                frequency: frequencyLabel(repeat).toLowerCase(),
              })
            : t('form.repeatSet', { date: formatDate(values.date, 'D MMM') });
        } else {
          // Offline-first: write to SQLite immediately (works online or offline).
          const created = await transactionData.createTransaction({
            userId: user.sub as string,
            amount,
            description,
            date,
            categoryId: values.categoryId,
            type,
          });
          setTransactions(prev => [created, ...prev]);
        }

        triggerSuccessHaptic();

        resetForm({
          values: {
            [EAddTransactionFields.DATE]: new Date(),
            [EAddTransactionFields.DESCRIPTION]: '',
            [EAddTransactionFields.AMOUNT]: '',
            [EAddTransactionFields.CATEGORY_ID]: values.categoryId,
            [EAddTransactionFields.REPEAT]: 'never',
            [EAddTransactionFields.REPEAT_END]: null,
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
            text1: toastText,
          });

          await getExceedExpenseNotification();

          // Push to the cloud now if online; a no-op (queued) when offline.
          syncNow();

          if (entryAdded) onSaved?.({ type, date: dayjs(values.date).toDate() });
        });
      } catch (error: any) {
        console.error('Transaction Creation Error:', error);
        Toast.show({
          type: 'error',
          text1: t('form.addFailed'),
        });
      } finally {
        setLoading(false);
      }
    },
    [
      transactionData,
      recurringData,
      user?.sub,
      activeCategories,
      getExceedExpenseNotification,
      getUserExpenses,
      handleClose,
      onCategoryUsed,
      refreshAnalytics,
      refreshSummary,
      onSaved,
      setTransactions,
      syncNow,
      transactionType,
      t,
      formatDate,
      frequencyLabel,
    ],
  );

  return (
    <BaseBottomSheet index={openCreationModal ? 1 : -1} onClose={handleClose}>
      <Formik
        // A prefill (from the Recurring screen) remounts the form with it.
        key={prefill ? `${prefill.description}-${prefill.date.getTime()}` : 'blank'}
        initialValues={{
          [EAddTransactionFields.DATE]: prefill?.date ?? new Date(),
          [EAddTransactionFields.DESCRIPTION]: prefill?.description ?? '',
          [EAddTransactionFields.AMOUNT]: '',
          [EAddTransactionFields.CATEGORY_ID]: defaultCategoryId,
          [EAddTransactionFields.REPEAT]: prefill?.repeat ?? 'never',
          [EAddTransactionFields.REPEAT_END]: null,
        }}
        onSubmit={handleAddTransaction}
        validationSchema={CreateTransactionSchema}
      >
        {({ handleSubmit }) => (
          <View style={styles.container}>
            <TransactionSegmentedControl
              options={['Expense', 'Income']}
              labels={{ Expense: t('wallet.expense'), Income: t('wallet.income') }}
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
              allowRepeat
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
