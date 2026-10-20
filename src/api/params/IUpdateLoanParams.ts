import {LoanType} from '@trackingPortal/api/enums';
import {LoanId, UnixTimeStampString} from '@trackingPortal/api/primitives';

export interface IUpdateLoanParams {
  id: LoanId;
  amount?: number;
  name?: string;
  deadLine?: UnixTimeStampString;
  note?: string | null;
  loanType?: LoanType;
  /** Absent = unchanged on the server; null = reopen. */
  settledAt?: UnixTimeStampString | null;
}
