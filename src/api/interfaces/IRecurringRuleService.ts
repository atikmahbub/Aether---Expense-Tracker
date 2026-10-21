import {
  IAddRecurringRuleParams,
  IUpdateRecurringRuleParams,
} from '@trackingPortal/api/params';
import {RecurringRuleId, UserId} from '@trackingPortal/api/primitives';
import {RecurringRuleModel} from '@trackingPortal/api/models/RecurringRuleModel';

export interface IRecurringRuleService {
  addRecurringRule(params: IAddRecurringRuleParams): Promise<RecurringRuleModel>;
  getRecurringRulesByUserId(userId: UserId): Promise<RecurringRuleModel[]>;
  updateRecurringRule(params: IUpdateRecurringRuleParams): Promise<RecurringRuleModel>;
  deleteRecurringRule(id: RecurringRuleId, userId: UserId): Promise<void>;
}
