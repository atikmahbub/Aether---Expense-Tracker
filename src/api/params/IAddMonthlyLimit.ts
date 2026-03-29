import {IGetMonthlyLimitParams} from '@trackingPortal/api/params/IGetMonthlyLimitParams';

export interface IAddMonthlyLimit extends IGetMonthlyLimitParams {
  limit: number;
}
