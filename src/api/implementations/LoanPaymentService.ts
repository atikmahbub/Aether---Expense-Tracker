import {IAxiosAjaxUtils} from '@trackingPortal/api/utils/IAxiosAjaxUtils';
import {ILoanPaymentService} from '@trackingPortal/api/interfaces/ILoanPaymentService';
import {TrackingWalletConfig} from '../TrackingWalletConfig';
import {
  IAddLoanPaymentParams,
  IUpdateLoanPaymentParams,
} from '@trackingPortal/api/params';
import {urlJoin} from 'url-join-ts';
import {LoanPaymentId, UserId} from '@trackingPortal/api/primitives';
import {LoanPaymentModel} from '@trackingPortal/api/models/LoanPaymentModel';

export class LoanPaymentService implements ILoanPaymentService {
  constructor(
    protected config: TrackingWalletConfig,
    protected ajaxUtils: IAxiosAjaxUtils,
  ) {}

  async addLoanPayment(params: IAddLoanPaymentParams): Promise<LoanPaymentModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan-payment', 'add'));
    const response = await this.ajaxUtils.post(url, {...params});

    if (response.isOk()) {
      return response.value as LoanPaymentModel;
    }
    throw new Error(response.error);
  }

  async getLoanPaymentsByUserId(userId: UserId): Promise<LoanPaymentModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan-payment', userId));
    const response = await this.ajaxUtils.get(url);

    if (response.isOk()) {
      return response.value as LoanPaymentModel[];
    }
    throw new Error(response.error);
  }

  async updateLoanPayment(
    params: IUpdateLoanPaymentParams,
  ): Promise<LoanPaymentModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan-payment', params.id));
    const response = await this.ajaxUtils.put(url, {...params});

    if (response.isOk()) {
      return response.value as LoanPaymentModel;
    }
    throw new Error(response.error);
  }

  async deleteLoanPayment(id: LoanPaymentId, userId: UserId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'loan-payment', id));
    url.searchParams.set('userId', userId);
    const response = await this.ajaxUtils.delete(url);

    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }
}
