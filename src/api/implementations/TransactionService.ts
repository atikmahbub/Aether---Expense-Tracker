import {IAxiosAjaxUtils} from '@trackingPortal/api/utils/IAxiosAjaxUtils';
import {ITransactionService} from '@trackingPortal/api/interfaces';
import {TrackingWalletConfig} from '../TrackingWalletConfig';
import {
  IAddTransactionParams,
  IGetTransactionAnalyticsParams,
  IGetUserTransactions,
  IUpdateTransactionParams,
} from '@trackingPortal/api/params';
import {urlJoin} from 'url-join-ts';
import {TransactionId, UserId} from '@trackingPortal/api/primitives';
import {
  TransactionAnalyticsModel,
  ExpenseCategoryModel,
  TransactionModel,
  TransactionModelV1,
  TransactionSummaryModel,
} from '@trackingPortal/api/models';

export class TransactionService implements ITransactionService {
  constructor(
    protected config: TrackingWalletConfig,
    protected ajaxUtils: IAxiosAjaxUtils,
  ) {}

  async addExpense(params: Omit<IAddTransactionParams, 'type'>): Promise<TransactionModelV1> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'expense', 'add'));
    const response = await this.ajaxUtils.post(url, params);
    if (response.isOk()) {
      return response.value as TransactionModelV1;
    }
    throw new Error(response.error);
  }

  async addIncome(params: Omit<IAddTransactionParams, 'type'>): Promise<TransactionModelV1> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income', 'add'));
    const response = await this.ajaxUtils.post(url, params);
    if (response.isOk()) {
      return response.value as TransactionModelV1;
    }
    throw new Error(response.error);
  }

  async updateExpense(id: TransactionId, params: Omit<IUpdateTransactionParams, 'id' | 'type'>): Promise<TransactionModelV1> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'expense', id));
    // Include id in body as some backends require it matched with path
    const response = await this.ajaxUtils.put(url, {id, ...params});
    if (response.isOk()) {
      return response.value as TransactionModelV1;
    }
    throw new Error(response.error);
  }

  async updateIncome(id: TransactionId, params: Omit<IUpdateTransactionParams, 'id' | 'type'>): Promise<TransactionModelV1> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income', id));
    // Include id in body as some backends require it matched with path
    const response = await this.ajaxUtils.put(url, {id, ...params});
    if (response.isOk()) {
      return response.value as TransactionModelV1;
    }
    throw new Error(response.error);
  }

  async deleteExpense(id: TransactionId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'expense', id));
    const response = await this.ajaxUtils.delete(url);
    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }

  async deleteIncome(id: TransactionId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income', id));
    const response = await this.ajaxUtils.delete(url);
    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }

  async addTransaction(params: IAddTransactionParams): Promise<TransactionModelV1> {
    const {type, ...payload} = params;
    if (type === 'income') {
      return this.addIncome(payload);
    } else {
      return this.addExpense(payload);
    }
  }

  async updateTransaction(params: IUpdateTransactionParams): Promise<TransactionModelV1> {
    const {id, type, ...payload} = params;
    if (type === 'income') {
      return this.updateIncome(id, payload);
    } else {
      return this.updateExpense(id, payload);
    }
  }

  async getTransactionsByUser(params: IGetUserTransactions): Promise<TransactionModelV1[]> {
    const {userId, type, ...query} = params;
    const resource = type === 'income' ? 'income' : 'expenses';
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', resource, userId),
    );
    const response = await this.ajaxUtils.get(url, query);

    if (response.isOk()) {
      return response.value as TransactionModelV1[];
    }
    throw new Error(response.error);
  }

  async deleteTransaction(id: TransactionId, type?: 'expense' | 'income'): Promise<void> {
    if (type === 'income') {
      return this.deleteIncome(id);
    } else {
      return this.deleteExpense(id);
    }
  }

  async exceedTransactionNotification(userId: UserId): Promise<boolean> {
    const url = new URL(
      urlJoin(
        this.config.baseUrl,
        'v0',
        'expense',
        'notifications',
        userId,
        'exceed-limit',
      ),
    );
    const response = await this.ajaxUtils.get(url);

    if (response.isOk()) {
      return response.value as boolean;
    }
    throw new Error(response.error);
  }

  async getCategories(): Promise<ExpenseCategoryModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'categories'));
    const response = await this.ajaxUtils.get(url);

    if (response.isOk()) {
      return response.value as ExpenseCategoryModel[];
    }
    throw new Error(response.error);
  }

  async getTransactionAnalytics(
    params: IGetTransactionAnalyticsParams,
  ): Promise<TransactionAnalyticsModel> {
    const {type, ...query} = params;
    const resource = type === 'income' ? 'income' : 'expenses';
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', resource, 'analytics'),
    );
    const response = await this.ajaxUtils.get(url, query);

    if (response.isOk()) {
      return response.value as TransactionAnalyticsModel;
    }
    throw new Error(response.error);
  }

  async getTransactions(params: IGetUserTransactions): Promise<TransactionModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'transactions'));
    const response = await this.ajaxUtils.get(url, {...params});

    if (response.isOk()) {
      return response.value as TransactionModel[];
    }
    throw new Error(response.error);
  }

  async getIncomeCategories(userId: UserId): Promise<ExpenseCategoryModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income-categories', userId));
    const response = await this.ajaxUtils.get(url);

    if (response.isOk()) {
      return response.value as ExpenseCategoryModel[];
    }
    throw new Error(response.error);
  }

  async getTransactionSummary(userId: UserId, date?: string): Promise<TransactionSummaryModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'transactions', 'summary', userId));
    const response = await this.ajaxUtils.get(url, { date });

    if (response.isOk()) {
      return response.value as TransactionSummaryModel;
    }
    throw new Error(response.error);
  }
}
