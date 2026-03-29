import {IAxiosAjaxUtils} from '@trackingPortal/api/utils/IAxiosAjaxUtils';
import {ILoanService} from '@trackingPortal/api/interfaces';
import {TrackingWalletConfig} from '../TrackingWalletConfig';
import {IAddLoanParams, IUpdateLoanParams} from '@trackingPortal/api/params';
import {urlJoin} from 'url-join-ts';
import {LoanId, UserId} from '@trackingPortal/api/primitives';
import {LoanModel} from '@trackingPortal/api/models/LoanModel';

export class LoanService implements ILoanService {
  constructor(
    protected config: TrackingWalletConfig,
    protected ajaxUtils: IAxiosAjaxUtils,
  ) {}

  async addLoan(params: IAddLoanParams): Promise<LoanModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan', 'add'));
    const response = await this.ajaxUtils.post(url, {...params});

    if (response.isOk()) {
      return response.value as LoanModel;
    }
    throw new Error(response.error);
  }

  async getLoanByUserId(userId: UserId): Promise<LoanModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan', userId));
    const response = await this.ajaxUtils.get(url);

    if (response.isOk()) {
      return response.value as LoanModel[];
    }
    throw new Error(response.error);
  }

  async updateLoan(params: IUpdateLoanParams): Promise<LoanModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan', params.id));
    const response = await this.ajaxUtils.put(url, {...params});

    if (response.isOk()) {
      return response.value as LoanModel;
    }
    throw new Error(response.error);
  }

  async deleteLoan(id: LoanId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan', id));
    const response = await this.ajaxUtils.delete(url);

    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }
}
