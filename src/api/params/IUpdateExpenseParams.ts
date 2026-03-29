import {
  ExpenseId,
  UnixTimeStampString,
  UserId,
} from '@trackingPortal/api/primitives';

export interface IUpdateExpenseParams {
  id: ExpenseId;
  amount?: number;
  description?: string | null;
  date?: UnixTimeStampString;
  categoryId?: string | null;
}
