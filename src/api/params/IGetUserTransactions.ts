import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IGetUserTransactions {
  userId: UserId;
  date: UnixTimeStampString;
}
