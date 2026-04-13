import {
  TransactionId,
  UnixTimeStampString,
  UserId,
} from '@trackingPortal/api/primitives';

export interface IUpdateTransactionParams {
  id: TransactionId;
  amount?: number;
  description?: string | null;
  date?: UnixTimeStampString;
  categoryId?: string | null;
}
