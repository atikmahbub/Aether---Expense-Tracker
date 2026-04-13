export interface TransactionAnalyticsCategory {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface TransactionAnalyticsModel {
  totalTransaction: number;
  categoryBreakdown: TransactionAnalyticsCategory[];
  topCategory: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
  } | null;
}
