import {
  LoanPaymentId,
  UnixTimeStampString,
  UserId,
} from '@trackingPortal/api/primitives';

export interface IUpdateLoanPaymentParams {
  id: LoanPaymentId;
  /** The server checks ownership against this. */
  userId: UserId;
  amount?: number;
  date?: UnixTimeStampString;
  note?: string | null;
}
