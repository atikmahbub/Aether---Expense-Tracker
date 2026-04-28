import { IAxiosAjaxUtils } from '@trackingPortal/api/utils/IAxiosAjaxUtils';
import { ICategoryService } from '@trackingPortal/api/interfaces';
import { TrackingWalletConfig } from '../TrackingWalletConfig';
import { ICreateCategoryParams, IUpdateCategoryParams } from '@trackingPortal/api/params';
import { urlJoin } from 'url-join-ts';
import { UserId } from '@trackingPortal/api/primitives';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';

export class CategoryService implements ICategoryService {
  constructor(
    protected config: TrackingWalletConfig,
    protected ajaxUtils: IAxiosAjaxUtils,
  ) {}

  // Expense Categories
  async getExpenseCategories(userId: UserId): Promise<ExpenseCategoryModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'categories'));
    const response = await this.ajaxUtils.get(url, { userId });
    if (response.isOk()) {
      return response.value as ExpenseCategoryModel[];
    }
    throw new Error(response.error);
  }

  async createExpenseCategory(params: ICreateCategoryParams): Promise<ExpenseCategoryModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'categories'));
    const response = await this.ajaxUtils.post(url, params);
    if (response.isOk()) {
      return response.value as ExpenseCategoryModel;
    }
    throw new Error(response.error);
  }

  async updateExpenseCategory(id: string, params: IUpdateCategoryParams): Promise<ExpenseCategoryModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'categories', id));
    const response = await this.ajaxUtils.put(url, params);
    if (response.isOk()) {
      return response.value as ExpenseCategoryModel;
    }
    throw new Error(response.error);
  }

  async deleteExpenseCategory(id: string, userId: UserId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'categories', id));
    const response = await this.ajaxUtils.delete(url, { userId });
    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }

  // Income Categories
  async getIncomeCategories(userId: UserId): Promise<IncomeCategoryModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income-categories', userId));
    const response = await this.ajaxUtils.get(url);
    if (response.isOk()) {
      return response.value as IncomeCategoryModel[];
    }
    throw new Error(response.error);
  }

  async createIncomeCategory(params: ICreateCategoryParams): Promise<IncomeCategoryModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income-categories'));
    const response = await this.ajaxUtils.post(url, params);
    if (response.isOk()) {
      return response.value as IncomeCategoryModel;
    }
    throw new Error(response.error);
  }

  async updateIncomeCategory(id: string, params: IUpdateCategoryParams): Promise<IncomeCategoryModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income-category', id));
    const response = await this.ajaxUtils.put(url, params);
    if (response.isOk()) {
      return response.value as IncomeCategoryModel;
    }
    throw new Error(response.error);
  }

  async deleteIncomeCategory(id: string, userId: UserId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'income-category', id));
    const response = await this.ajaxUtils.delete(url, { userId });
    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }
}
