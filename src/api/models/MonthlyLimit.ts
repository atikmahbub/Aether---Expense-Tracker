import {
  UserId,
  Month,
  Year,
  UnixTimeStampString,
  MonthlyLimitId,
} from '@trackingPortal/api/primitives';

export class NewMonthlyLimit {
  constructor(
    public id: MonthlyLimitId,
    public userId: UserId,
    public month: Month,
    public year: Year,
    public limit: number,
  ) {}
}

export class MonthlyLimitModel extends NewMonthlyLimit {
  constructor(
    id: MonthlyLimitId,
    userId: UserId,
    month: Month,
    year: Year,
    limit: number,
    public updated: UnixTimeStampString,
    public created: UnixTimeStampString,
  ) {
    super(id, userId, month, year, limit);
  }
}
