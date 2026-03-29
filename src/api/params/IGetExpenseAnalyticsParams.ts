import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IGetExpenseAnalyticsParams {
  userId: UserId;
  date: UnixTimeStampString;
}
