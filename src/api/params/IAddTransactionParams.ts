import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IAddTransactionParams {
  userId: UserId;
  amount: number;
  description: string | null;
  date: UnixTimeStampString;
  categoryId: string;
  type?: 'expense' | 'income';
}
