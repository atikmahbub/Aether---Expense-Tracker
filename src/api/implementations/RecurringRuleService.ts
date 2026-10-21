import {IAxiosAjaxUtils} from '@trackingPortal/api/utils/IAxiosAjaxUtils';
import {IRecurringRuleService} from '@trackingPortal/api/interfaces/IRecurringRuleService';
import {TrackingWalletConfig} from '../TrackingWalletConfig';
import {
  IAddRecurringRuleParams,
  IUpdateRecurringRuleParams,
} from '@trackingPortal/api/params';
import {urlJoin} from 'url-join-ts';
import {RecurringRuleId, UserId} from '@trackingPortal/api/primitives';
import {RecurringRuleModel} from '@trackingPortal/api/models/RecurringRuleModel';

export class RecurringRuleService implements IRecurringRuleService {
  constructor(
    protected config: TrackingWalletConfig,
    protected ajaxUtils: IAxiosAjaxUtils,
  ) {}

  async addRecurringRule(params: IAddRecurringRuleParams): Promise<RecurringRuleModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'recurring-rule', 'add'));
    const response = await this.ajaxUtils.post(url, {...params});

    if (response.isOk()) {
      return response.value as RecurringRuleModel;
    }
    throw new Error(response.error);
  }

  async getRecurringRulesByUserId(userId: UserId): Promise<RecurringRuleModel[]> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'recurring-rule', userId));
    const response = await this.ajaxUtils.get(url);

    if (response.isOk()) {
      return response.value as RecurringRuleModel[];
    }
    throw new Error(response.error);
  }

  async updateRecurringRule(
    params: IUpdateRecurringRuleParams,
  ): Promise<RecurringRuleModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'recurring-rule', params.id));
    const response = await this.ajaxUtils.put(url, {...params});

    if (response.isOk()) {
      return response.value as RecurringRuleModel;
    }
    throw new Error(response.error);
  }

  async deleteRecurringRule(id: RecurringRuleId, userId: UserId): Promise<void> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'recurring-rule', id));
    url.searchParams.set('userId', userId);
    const response = await this.ajaxUtils.delete(url);

    if (response.isOk()) {
      return response.value as void;
    }
    throw new Error(response.error);
  }
}
