import {
  RecurringRuleId,
  UnixTimeStampString,
  UserId,
} from '@trackingPortal/api/primitives';

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurringRuleModel {
  id: RecurringRuleId;
  userId: UserId;
  type: 'expense' | 'income';
  amount: number;
  description: string | null;
  categoryId: string | null;
  frequency: RecurringFrequency;
  startDate: UnixTimeStampString;
  endDate: UnixTimeStampString | null;
  pausedAt: UnixTimeStampString | null;
  /** The latest occurrence already turned into a transaction. */
  lastRunDate: UnixTimeStampString | null;
  created: UnixTimeStampString;
  updated: UnixTimeStampString;
}
