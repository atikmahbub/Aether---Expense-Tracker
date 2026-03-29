import {INewExpense} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.interfaces';
import * as Yup from 'yup';

export enum EAddExpenseFields {
  AMOUNT = 'amount',
  DESCRIPTION = 'description',
  DATE = 'date',
  EXPENSE_LIST = 'expense_list',
  CATEGORY_ID = 'categoryId',
}

export enum EMonthlyLimitFields {
  LIMIT = 'limit',
}

export const defaultQuestion: INewExpense = {
  [EAddExpenseFields.AMOUNT]: '',
  [EAddExpenseFields.DESCRIPTION]: '',
  [EAddExpenseFields.DATE]: new Date(),
  [EAddExpenseFields.CATEGORY_ID]: '',
};

export const CreateExpenseSchema = Yup.object().shape({
  [EAddExpenseFields.DATE]: Yup.date().required('Date is required'),
  [EAddExpenseFields.DESCRIPTION]: Yup.string()
    .trim()
    .max(120, 'Purpose is too long')
    .optional(),
  [EAddExpenseFields.AMOUNT]: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive'),
  [EAddExpenseFields.CATEGORY_ID]: Yup.string().required('Pick a category'),
});
