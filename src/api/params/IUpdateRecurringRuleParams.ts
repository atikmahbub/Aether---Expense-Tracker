import {
  RecurringRuleId,
  UnixTimeStampString,
  UserId,
} from '@trackingPortal/api/primitives';
import {RecurringFrequency} from '@trackingPortal/api/models/RecurringRuleModel';

export interface IUpdateRecurringRuleParams {
  id: RecurringRuleId;
  /** The server checks ownership against this. */
  userId: UserId;
  amount: number;
  description: string | null;
  categoryId: string | null;
  frequency: RecurringFrequency;
  startDate: UnixTimeStampString;
  /** Always sent: null clears an end date / resumes a paused rule. */
  endDate: UnixTimeStampString | null;
  pausedAt: UnixTimeStampString | null;
  lastRunDate: UnixTimeStampString | null;
}
