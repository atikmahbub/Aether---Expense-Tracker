import {
  UnixTimeStampString,
  UserId,
} from '@trackingPortal/api/primitives';
import {RecurringFrequency} from '@trackingPortal/api/models/RecurringRuleModel';

export interface IAddRecurringRuleParams {
  userId: UserId;
  type: 'expense' | 'income';
  amount: number;
  description: string | null;
  categoryId: string | null;
  frequency: RecurringFrequency;
  startDate: UnixTimeStampString;
  endDate: UnixTimeStampString | null;
  pausedAt: UnixTimeStampString | null;
  lastRunDate: UnixTimeStampString | null;
}
