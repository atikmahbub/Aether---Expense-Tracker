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
