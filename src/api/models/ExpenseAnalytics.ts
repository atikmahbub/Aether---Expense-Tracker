export interface ExpenseAnalyticsCategory {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface ExpenseAnalyticsModel {
  totalExpense: number;
  categoryBreakdown: ExpenseAnalyticsCategory[];
  topCategory: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
  } | null;
}
