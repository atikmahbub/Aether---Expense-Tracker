import {INewTransaction} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.interfaces';
import * as Yup from 'yup';

export enum EAddTransactionFields {
  AMOUNT = 'amount',
  DESCRIPTION = 'description',
  DATE = 'date',
  TRANSACTION_LIST = 'transaction_list',
  CATEGORY_ID = 'categoryId',
}

export enum EMonthlyLimitFields {
  LIMIT = 'limit',
}

export const defaultTransaction: INewTransaction = {
  [EAddTransactionFields.AMOUNT]: '',
  [EAddTransactionFields.DESCRIPTION]: '',
  [EAddTransactionFields.DATE]: new Date(),
  [EAddTransactionFields.CATEGORY_ID]: '',
};

/** Resolves the calculator expression used by the transaction amount keypad. */
export const resolveTransactionAmount = (value: unknown): number | null => {
  const expression = String(value ?? '').trim().replace(/[+-]+$/, '');
  if (!/^\d+(?:\.\d+)?(?:[+-]\d+(?:\.\d+)?)*$/.test(expression)) {
    return null;
  }

  const parts = expression.split(/([+-])/);
  let total = Number(parts[0]);
  for (let index = 1; index < parts.length; index += 2) {
    const operand = Number(parts[index + 1]);
    total = parts[index] === '+' ? total + operand : total - operand;
  }
  return Number.isFinite(total) ? total : null;
};

export const CreateTransactionSchema = Yup.object().shape({
  [EAddTransactionFields.DATE]: Yup.date().required('Date is required'),
  [EAddTransactionFields.DESCRIPTION]: Yup.string()
    .trim()
    .max(120, 'Purpose is too long')
    .optional(),
  [EAddTransactionFields.AMOUNT]: Yup.number()
    .transform((_value, originalValue) => {
      const resolved = resolveTransactionAmount(originalValue);
      return resolved ?? (String(originalValue ?? '').trim() ? Number.NaN : undefined);
    })
    .required('Amount is required')
    .positive('Amount must be positive'),
  [EAddTransactionFields.CATEGORY_ID]: Yup.string().required('Pick a category'),
});
