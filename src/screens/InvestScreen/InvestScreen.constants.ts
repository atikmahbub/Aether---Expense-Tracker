import {EInvestStatus} from '@trackingPortal/api/enums';
import {INewInvest} from '@trackingPortal/screens/InvestScreen';
import * as Yup from 'yup';

export const filterInvestByStatusMenu = [
  {value: EInvestStatus.Active, label: 'Active'},
  {value: EInvestStatus.Completed, label: 'Completed'},
];

export enum EAddInvestFormFields {
  NAME = 'name',
  START_DATE = 'start_date',
  END_DATE = 'end_date',
  AMOUNT = 'amount',
  NOTE = 'note',
  PROFIT = 'profit',
  INVEST_LIST = 'invest_list',
  EARNED = 'earned',
  STATUS = 'status',
}

export const defaultInvest: INewInvest = {
  [EAddInvestFormFields.NAME]: '',
  [EAddInvestFormFields.START_DATE]: new Date(),
  [EAddInvestFormFields.AMOUNT]: '',
  [EAddInvestFormFields.NOTE]: '',
};

export const AddInvestSchema = Yup.object().shape({
  [EAddInvestFormFields.NAME]: Yup.string().required('Name is required'),
  [EAddInvestFormFields.NOTE]: Yup.string().required('Name is required'),
  [EAddInvestFormFields.AMOUNT]: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive'),
});

/**
 * True when an investment has a current value to compare against. An empty
 * "earned" field was historically saved as 0 (Number("")), so 0 means "not
 * entered yet", not a total loss; counting it showed a bogus −100% return.
 */
export const hasReturnValue = (invest: { earned: number | null; amount: number }) =>
  invest.earned != null && invest.earned > 0 && invest.amount > 0;
