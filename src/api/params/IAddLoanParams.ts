import {LoanType} from '@trackingPortal/api/enums';
import {UnixTimeStampString, UserId} from '@trackingPortal/api/primitives';

export interface IAddLoanParams {
  userId: UserId;
  name: string;
  amount: number;
  deadLine: UnixTimeStampString;
  loanType: LoanType;
  note: string | null;
}
