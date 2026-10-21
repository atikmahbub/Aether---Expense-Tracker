import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IAddTransactionParams {
  userId: UserId;
  amount: number;
  description: string | null;
  date: UnixTimeStampString;
  categoryId: string;
  type?: 'expense' | 'income';
  /** Server id of the rule that generated this entry; sent with occurrenceDate. */
  recurringRuleId?: string | null;
  occurrenceDate?: UnixTimeStampString | null;
}
