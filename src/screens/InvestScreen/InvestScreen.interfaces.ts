import {EAddInvestFormFields} from '@trackingPortal/screens/InvestScreen';

export interface INewInvest {
  [EAddInvestFormFields.NAME]: string;
  [EAddInvestFormFields.NOTE]: string;
  [EAddInvestFormFields.START_DATE]: Date;
  [EAddInvestFormFields.AMOUNT]: string;
}
