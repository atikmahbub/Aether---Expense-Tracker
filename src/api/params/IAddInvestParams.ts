import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IAddInvestParams {
  userId: UserId;
  name: string;
  amount: number;
  note: string;
  startDate: UnixTimeStampString;
  endDate?: UnixTimeStampString;
}
