import {
  TransactionAnalyticsModel,
  ExpenseCategoryModel, // Categories might still be named ExpenseCategory or just Category
  TransactionModel,
  TransactionModelV1,
} from '@trackingPortal/api/models';
import {
  IAddTransactionParams,
  IGetTransactionAnalyticsParams,
  IGetUserTransactions,
  IUpdateTransactionParams,
} from '@trackingPortal/api/params';
import {TransactionId, UserId} from '@trackingPortal/api/primitives';

export interface ITransactionService {
  addTransaction: (params: IAddTransactionParams) => Promise<TransactionModelV1>;
  updateTransaction: (params: IUpdateTransactionParams) => Promise<TransactionModelV1>;
  getTransactionsByUser: (params: IGetUserTransactions) => Promise<TransactionModelV1[]>;
  getTransactions: (params: IGetUserTransactions) => Promise<TransactionModel[]>;
  deleteTransaction(id: TransactionId): Promise<void>;
  exceedTransactionNotification: (userId: UserId) => Promise<boolean>;
  getCategories: () => Promise<ExpenseCategoryModel[]>;
  getTransactionAnalytics: (
    params: IGetTransactionAnalyticsParams,
  ) => Promise<TransactionAnalyticsModel>;
  getIncomeCategories: (userId: UserId) => Promise<ExpenseCategoryModel[]>;
}
