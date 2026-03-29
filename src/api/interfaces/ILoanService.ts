import {IAddLoanParams, IUpdateLoanParams} from '@trackingPortal/api/params';
import {LoanId, UserId} from '@trackingPortal/api/primitives';
import {LoanModel} from '@trackingPortal/api/models/LoanModel';

export interface ILoanService {
  addLoan(params: IAddLoanParams): Promise<LoanModel>;
  getLoanByUserId(userId: UserId): Promise<LoanModel[]>;
  updateLoan(params: IUpdateLoanParams): Promise<LoanModel>;
  deleteLoan(id: LoanId): Promise<void>;
}
