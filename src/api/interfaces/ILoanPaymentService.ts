import {
  IAddLoanPaymentParams,
  IUpdateLoanPaymentParams,
} from '@trackingPortal/api/params';
import {LoanPaymentId, UserId} from '@trackingPortal/api/primitives';
import {LoanPaymentModel} from '@trackingPortal/api/models/LoanPaymentModel';

export interface ILoanPaymentService {
  addLoanPayment(params: IAddLoanPaymentParams): Promise<LoanPaymentModel>;
  getLoanPaymentsByUserId(userId: UserId): Promise<LoanPaymentModel[]>;
  updateLoanPayment(params: IUpdateLoanPaymentParams): Promise<LoanPaymentModel>;
  deleteLoanPayment(id: LoanPaymentId, userId: UserId): Promise<void>;
}
