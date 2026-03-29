import {
  UnixTimeStampString,
  ExpenseId,
  UserId,
} from '@trackingPortal/api/primitives';

export class NewExpense {
  constructor(
    public date: UnixTimeStampString,
    public amount: number,
    public description: string | null,
    public categoryId?: string | null,
  ) {}
}

export class ExpenseModel extends NewExpense {
  constructor(
    public id: ExpenseId,
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
