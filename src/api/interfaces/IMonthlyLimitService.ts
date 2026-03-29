import {MonthlyLimitModel} from '@trackingPortal/api/models/MonthlyLimit';
import {
  IAddMonthlyLimit,
  IGetMonthlyLimitParams,
  IUpdateMonthlyLimitParams,
} from '@trackingPortal/api/params';
import {MonthlyLimitId} from '@trackingPortal/api/primitives';

export interface IMonthlyLimitService {
  addMonthlyLimit(params: IAddMonthlyLimit): Promise<MonthlyLimitModel>;
  getMonthlyLimitByUserId(
    params: IGetMonthlyLimitParams,
  ): Promise<MonthlyLimitModel>;
  updateMonthlyLimit(
    params: IUpdateMonthlyLimitParams,
  ): Promise<MonthlyLimitModel>;
  deleteMonthlyLimit(id: MonthlyLimitId): Promise<void>;
}
