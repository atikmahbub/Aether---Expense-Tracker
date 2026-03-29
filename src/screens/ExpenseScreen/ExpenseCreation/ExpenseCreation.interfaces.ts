import {EAddExpenseFields} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.constants';

export interface INewExpense {
  [EAddExpenseFields.AMOUNT]: string;
  [EAddExpenseFields.DESCRIPTION]: string;
  [EAddExpenseFields.DATE]: Date;
  [EAddExpenseFields.CATEGORY_ID]: string;
}
