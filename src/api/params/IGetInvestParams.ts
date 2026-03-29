import {EInvestStatus} from '@trackingPortal/api/enums';
import {UserId} from '@trackingPortal/api/primitives';

export interface IGetInvestParams {
  userId: UserId;
  status: EInvestStatus;
}
