import {EAddTransactionFields} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';

export interface INewTransaction {
  [EAddTransactionFields.AMOUNT]: string;
  [EAddTransactionFields.DESCRIPTION]: string;
  [EAddTransactionFields.DATE]: Date;
  [EAddTransactionFields.CATEGORY_ID]: string;
}
