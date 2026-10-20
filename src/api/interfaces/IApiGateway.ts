import {
  ITransactionService,
  IUserService,
  IMonthlyLimitService,
  ILoanService,
  ILoanPaymentService,
  IInvestService,
  ICategoryService,
} from "@trackingPortal/api/interfaces";
import { TrackingWalletConfig } from "@trackingPortal/api/TrackingWalletConfig";
import { IAxiosAjaxUtils } from "@trackingPortal/api/utils/IAxiosAjaxUtils";

export interface IApiGateWay {
  config: TrackingWalletConfig;
  ajaxUtils: IAxiosAjaxUtils;
  userService: IUserService;
  transactionService: ITransactionService;
  monthlyLimitService: IMonthlyLimitService;
  loanServices: ILoanService;
  loanPaymentService: ILoanPaymentService;
  investService: IInvestService;
  categoryService: ICategoryService;
}
