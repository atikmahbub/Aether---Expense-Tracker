import {
  TransactionAnalyticsModel,
  ExpenseCategoryModel, // Categories might still be named ExpenseCategory or just Category
  TransactionModel,
  TransactionModelV1,
  TransactionSummaryModel,
} from '@trackingPortal/api/models';
import {
  IAddTransactionParams,
  IGetTransactionAnalyticsParams,
  IGetUserTransactions,
  IUpdateTransactionParams,
} from '@trackingPortal/api/params';
import {TransactionId, UserId} from '@trackingPortal/api/primitives';

export interface ITransactionService {
  addExpense: (params: Omit<IAddTransactionParams, 'type'>) => Promise<TransactionModelV1>;
  addIncome: (params: Omit<IAddTransactionParams, 'type'>) => Promise<TransactionModelV1>;
  updateExpense: (id: TransactionId, params: Omit<IUpdateTransactionParams, 'id' | 'type'>) => Promise<TransactionModelV1>;
  updateIncome: (id: TransactionId, params: Omit<IUpdateTransactionParams, 'id' | 'type'>) => Promise<TransactionModelV1>;
  deleteExpense: (id: TransactionId) => Promise<void>;
  deleteIncome: (id: TransactionId) => Promise<void>;

  addTransaction: (params: IAddTransactionParams) => Promise<TransactionModelV1>;
  updateTransaction: (params: IUpdateTransactionParams) => Promise<TransactionModelV1>;
  deleteTransaction: (id: TransactionId, type?: 'expense' | 'income') => Promise<void>;

  getTransactionsByUser: (params: IGetUserTransactions) => Promise<TransactionModelV1[]>;
  getTransactions: (params: IGetUserTransactions) => Promise<TransactionModel[]>;
  exceedTransactionNotification: (userId: UserId) => Promise<boolean>;
  getCategories: () => Promise<ExpenseCategoryModel[]>;
  getTransactionAnalytics: (
    params: IGetTransactionAnalyticsParams,
  ) => Promise<TransactionAnalyticsModel>;
  getIncomeCategories: (userId: UserId) => Promise<ExpenseCategoryModel[]>;
  getTransactionSummary: (userId: UserId, date?: string) => Promise<TransactionSummaryModel>;
}
