import * as Yup from 'yup';
import {INewLoan} from '@trackingPortal/screens/LoanScreen';
import {LoanType} from '@trackingPortal/api/enums';
import dayjs from 'dayjs';

export enum EAddLoanFields {
  NAME = 'name',
  LOAN_TYPE = 'loan_type',
  AMOUNT = 'amount',
  DEADLINE = 'deadLine',
  NOTE = 'note',
  LOAN_LIST = 'loan_list',
}

export const loanTypeOptions = [
  {text: 'Giving To', value: LoanType.GIVEN},
  {text: 'Taking From', value: LoanType.TAKEN},
];

export const defaultLoan: INewLoan = {
  [EAddLoanFields.AMOUNT]: '',
  [EAddLoanFields.NAME]: '',
  [EAddLoanFields.LOAN_TYPE]: LoanType.GIVEN,
  [EAddLoanFields.DEADLINE]: new Date(),
  [EAddLoanFields.NOTE]: '',
};

export const AddLoanSchema = Yup.object().shape({
  [EAddLoanFields.NAME]: Yup.string().required('Name is required'),
  [EAddLoanFields.AMOUNT]: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive'),
});
