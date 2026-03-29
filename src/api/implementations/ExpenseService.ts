import {IAxiosAjaxUtils} from '@trackingPortal/api/utils/IAxiosAjaxUtils';
import {IExpenseService} from '@trackingPortal/api/interfaces';
import {TrackingWalletConfig} from '../TrackingWalletConfig';
import {ExpenseModel} from '@trackingPortal/api/models/Expense';
import {
  IAddExpenseParams,
  IGetExpenseAnalyticsParams,
  IGetUserExpenses,
  IUpdateExpenseParams,
} from '@trackingPortal/api/params';
import {urlJoin} from 'url-join-ts';
import {ExpenseId, UserId} from '@trackingPortal/api/primitives';
import {
  ExpenseAnalyticsModel,
  ExpenseCategoryModel,
} from '@trackingPortal/api/models';

export class ExpenseService implements IExpenseService {
  constructor(
    protected config: TrackingWalletConfig,
    protected ajaxUtils: IAxiosAjaxUtils,
  ) {}

  async addExpense(params: IAddExpenseParams): Promise<ExpenseModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'expense', 'add'));
    const response = await this.ajaxUtils.post(url, {...params});

    if (response.isOk()) {
      return response.value as ExpenseModel;
    }
    throw new Error(response.error);
  }

  async updateExpense(params: IUpdateExpenseParams): Promise<ExpenseModel> {
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', 'expense', params.id),
    );
    const response = await this.ajaxUtils.put(url, {...params});

    if (response.isOk()) {
      return response.value as ExpenseModel;
    }
    throw new Error(response.error);
  }

  async getExpenseByUser(params: IGetUserExpenses): Promise<ExpenseModel[]> {
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', 'expenses', params.userId),
    );
    const response = await this.ajaxUtils.get(url, {...params});

    if (response.isOk()) {
      return response.value as ExpenseModel[];
    }
    throw new Error(response.error);
  }

  async deleteExpense(id: ExpenseId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'expense', id));
    const response = await this.ajaxUtils.delete(url);

    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }

  async exceedExpenseNotification(userId: UserId): Promise<boolean> {
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

  async getExpenseAnalytics(
    params: IGetExpenseAnalyticsParams,
  ): Promise<ExpenseAnalyticsModel> {
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', 'expenses', 'analytics'),
    );
    const response = await this.ajaxUtils.get(url, {...params});

    if (response.isOk()) {
      return response.value as ExpenseAnalyticsModel;
    }
    throw new Error(response.error);
  }
}
