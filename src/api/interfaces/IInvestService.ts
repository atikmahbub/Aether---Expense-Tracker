import {InvestModel} from '@trackingPortal/api/models';
import {
  IAddInvestParams,
  IGetInvestParams,
  IUpdateInvestParams,
} from '@trackingPortal/api/params';
import {InvestId} from '@trackingPortal/api/primitives';

export interface IInvestService {
  addInvest(params: IAddInvestParams): Promise<InvestModel>;
  updateInvest: (params: IUpdateInvestParams) => Promise<InvestModel>;
  getInvestByUserId: (params: IGetInvestParams) => Promise<InvestModel[]>;
  deleteInvest(id: InvestId): Promise<void>;
}
