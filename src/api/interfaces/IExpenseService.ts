import {
  ExpenseAnalyticsModel,
  ExpenseCategoryModel,
  ExpenseModel,
} from '@trackingPortal/api/models';
import {
  IAddExpenseParams,
  IGetExpenseAnalyticsParams,
  IGetUserExpenses,
  IUpdateExpenseParams,
} from '@trackingPortal/api/params';
import {ExpenseId, UserId} from '@trackingPortal/api/primitives';

export interface IExpenseService {
  addExpense: (params: IAddExpenseParams) => Promise<ExpenseModel>;
  updateExpense: (params: IUpdateExpenseParams) => Promise<ExpenseModel>;
  getExpenseByUser: (params: IGetUserExpenses) => Promise<ExpenseModel[]>;
  deleteExpense(id: ExpenseId): Promise<void>;
  exceedExpenseNotification: (userId: UserId) => Promise<boolean>;
  getCategories: () => Promise<ExpenseCategoryModel[]>;
  getExpenseAnalytics: (
    params: IGetExpenseAnalyticsParams,
  ) => Promise<ExpenseAnalyticsModel>;
}
