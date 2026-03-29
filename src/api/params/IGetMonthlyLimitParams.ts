import {Month, UserId, Year} from '@trackingPortal/api/primitives';

export interface IGetMonthlyLimitParams {
  userId: UserId;
  month: Month;
  year: Year;
}
