import {
  UnixTimeStampString,
  TransactionId,
  UserId,
} from '@trackingPortal/api/primitives';

export interface TransactionModel {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  date: string;
  category: {
    name: string;
    icon: string;
    color: string;
  };
}

export class NewTransaction {
  constructor(
    public date: UnixTimeStampString,
    public amount: number,
    public description: string | null,
    public categoryId?: string | null,
  ) {}
}

export class TransactionModelV1 extends NewTransaction {
  constructor(
    public id: TransactionId,
    public userId: UserId,
    amount: number,
    description: string | null,
    date: UnixTimeStampString,
    public updated: UnixTimeStampString,
    public created: UnixTimeStampString,
    categoryId?: string | null,
    public categoryName?: string | null,
  ) {
    super(date, amount, description, categoryId);
  }
}
