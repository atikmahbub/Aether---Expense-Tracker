import {
  LoanId,
  LoanPaymentId,
  UnixTimeStampString,
  UserId,
} from '@trackingPortal/api/primitives';

export interface LoanPaymentModel {
  id: LoanPaymentId;
  loanId: LoanId;
  userId: UserId;
  amount: number;
  date: UnixTimeStampString;
  note: string | null;
  created: UnixTimeStampString;
  updated: UnixTimeStampString;
}
