import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IAddExpenseParams {
  userId: UserId;
  amount: number;
  description: string | null;
  date: UnixTimeStampString;
  categoryId: string;
}
