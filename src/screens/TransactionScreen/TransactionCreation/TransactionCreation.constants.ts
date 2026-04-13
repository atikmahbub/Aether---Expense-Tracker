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

export const CreateTransactionSchema = Yup.object().shape({
  [EAddTransactionFields.DATE]: Yup.date().required('Date is required'),
  [EAddTransactionFields.DESCRIPTION]: Yup.string()
    .trim()
    .max(120, 'Purpose is too long')
    .optional(),
  [EAddTransactionFields.AMOUNT]: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive'),
  [EAddTransactionFields.CATEGORY_ID]: Yup.string().required('Pick a category'),
});
