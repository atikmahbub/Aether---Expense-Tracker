import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IGetUserExpenses {
  userId: UserId;
  date: UnixTimeStampString;
}
