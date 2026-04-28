import { ExpenseCategoryModel, IncomeCategoryModel } from "@trackingPortal/api/models";
import { ICreateCategoryParams, IUpdateCategoryParams } from "@trackingPortal/api/params";
import { UserId } from "@trackingPortal/api/primitives";

export interface ICategoryService {
  // Expense Categories
  getExpenseCategories: (userId: UserId) => Promise<ExpenseCategoryModel[]>;
  createExpenseCategory: (params: ICreateCategoryParams) => Promise<ExpenseCategoryModel>;
  updateExpenseCategory: (id: string, params: IUpdateCategoryParams) => Promise<ExpenseCategoryModel>;
  deleteExpenseCategory: (id: string, userId: UserId) => Promise<void>;

  // Income Categories
  getIncomeCategories: (userId: UserId) => Promise<IncomeCategoryModel[]>;
  createIncomeCategory: (params: ICreateCategoryParams) => Promise<IncomeCategoryModel>;
  updateIncomeCategory: (id: string, params: IUpdateCategoryParams) => Promise<IncomeCategoryModel>;
  deleteIncomeCategory: (id: string, userId: UserId) => Promise<void>;
}
