import {Month, MonthlyLimitId, Year} from '@trackingPortal/api/primitives';

export interface IUpdateMonthlyLimitParams {
  id: MonthlyLimitId;
  month?: Month;
  year?: Year;
  limit?: number;
}
