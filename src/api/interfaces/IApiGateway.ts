import {
  ExpenseService,
  UserService,
  MonthlyLimitService,
  LoanService,
  InvestService,
} from "@trackingPortal/api/implementations";
import { TrackingWalletConfig } from "@trackingPortal/api/TrackingWalletConfig";
import { IAxiosAjaxUtils } from "@trackingPortal/api/utils/IAxiosAjaxUtils";

export interface IApiGateWay {
  config: TrackingWalletConfig;
  ajaxUtils: IAxiosAjaxUtils;
  userService: UserService;
  expenseService: ExpenseService;
  monthlyLimitService: MonthlyLimitService;
  loanServices: LoanService;
  investService: InvestService;
}
