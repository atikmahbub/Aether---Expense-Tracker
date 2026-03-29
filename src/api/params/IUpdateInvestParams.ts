import {EInvestStatus} from '@trackingPortal/api/enums';
import {InvestId, UnixTimeStampString} from '@trackingPortal/api/primitives';

export interface IUpdateInvestParams {
  id: InvestId;
  amount?: number;
  name?: string;
  note?: string;
  startDate?: UnixTimeStampString;
  endDate?: UnixTimeStampString;
  status?: EInvestStatus;
  earned?: number;
}
