import {EInvestStatus} from '@trackingPortal/api/enums';
import {InvestId, UnixTimeStampString} from '@trackingPortal/api/primitives';

export class NewInvest {
  constructor(
    public name: string,
    public amount: number,
    public note: string,
    public startDate: UnixTimeStampString,
    public endDate: UnixTimeStampString | null,
    public status: EInvestStatus,
  ) {}
}

export class InvestModel extends NewInvest {
  constructor(
    public id: InvestId,
    name: string,
    amount: number,
    note: string,
    startDate: UnixTimeStampString,
    endDate: UnixTimeStampString | null,
    status: EInvestStatus,
    public earned: number | null,
    public created: UnixTimeStampString,
    public updated: UnixTimeStampString,
  ) {
    super(name, amount, note, startDate, endDate, status);
  }
}
