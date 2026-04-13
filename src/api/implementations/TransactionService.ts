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

  async addTransaction(params: IAddTransactionParams): Promise<TransactionModelV1> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'expense', 'add'));
    const response = await this.ajaxUtils.post(url, {...params});

    if (response.isOk()) {
      return response.value as TransactionModelV1;
    }
    throw new Error(response.error);
  }

  async updateTransaction(params: IUpdateTransactionParams): Promise<TransactionModelV1> {
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', 'expense', params.id),
    );
    const response = await this.ajaxUtils.put(url, {...params});

    if (response.isOk()) {
      return response.value as TransactionModelV1;
    }
    throw new Error(response.error);
  }

  async getTransactionsByUser(params: IGetUserTransactions): Promise<TransactionModelV1[]> {
    const resource = params.type === 'income' ? 'income' : 'expenses';
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', resource, params.userId),
    );
    const response = await this.ajaxUtils.get(url, {...params});

    if (response.isOk()) {
      return response.value as TransactionModelV1[];
    }
    throw new Error(response.error);
  }

  async deleteTransaction(id: TransactionId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'expense', id));
    const response = await this.ajaxUtils.delete(url);

    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
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
    const resource = params.type === 'income' ? 'income' : 'expenses';
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', resource, 'analytics'),
    );
    const response = await this.ajaxUtils.get(url, {...params});

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

  async getTransactionSummary(userId: UserId): Promise<TransactionSummaryModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'transactions', 'summary', userId));
    const response = await this.ajaxUtils.get(url);

    if (response.isOk()) {
      return response.value as TransactionSummaryModel;
    }
    throw new Error(response.error);
  }
}
