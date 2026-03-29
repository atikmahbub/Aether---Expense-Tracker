import {LoanType} from '@trackingPortal/api/enums';
import {EAddLoanFields} from '@trackingPortal/screens/LoanScreen';

export interface INewLoan {
  [EAddLoanFields.AMOUNT]: string;
  [EAddLoanFields.NAME]: string;
  [EAddLoanFields.LOAN_TYPE]: LoanType;
  [EAddLoanFields.DEADLINE]: Date;
  [EAddLoanFields.NOTE]: string;
}
