import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IGetTransactionAnalyticsParams {
  userId: UserId;
  date: UnixTimeStampString;
}
