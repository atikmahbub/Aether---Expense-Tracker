import {LoanId, UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IAddLoanPaymentParams {
  userId: UserId;
  loanId: LoanId;
  amount: number;
  date: UnixTimeStampString;
  note: string | null;
}
