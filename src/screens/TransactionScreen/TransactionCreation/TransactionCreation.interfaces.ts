import type {RepeatChoice} from '@trackingPortal/screens/TransactionScreen/components/RepeatPicker';
import {EAddTransactionFields} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';

export interface INewTransaction {
  [EAddTransactionFields.AMOUNT]: string;
  [EAddTransactionFields.DESCRIPTION]: string;
  [EAddTransactionFields.DATE]: Date;
  [EAddTransactionFields.CATEGORY_ID]: string;
  [EAddTransactionFields.REPEAT]?: RepeatChoice;
  [EAddTransactionFields.REPEAT_END]?: Date | null;
}
