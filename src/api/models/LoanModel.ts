import {LoanType} from '@trackingPortal/api/enums';
import {
  UnixTimeStampString,
  LoanId,
  UserId,
} from '@trackingPortal/api/primitives';

export class NewLoan {
  constructor(
    public name: string,
    public amount: number,
    public note: string | null,
    public deadLine: UnixTimeStampString,
    public loanType: LoanType,
  ) {}
}

export class LoanModel extends NewLoan {
  constructor(
    public id: LoanId,
    public userId: UserId,
    name: string,
    amount: number,
    note: string | null,
    deadLine: UnixTimeStampString | null,
    loanType: LoanType,
    public created: UnixTimeStampString,
    public updated: UnixTimeStampString,
  ) {
    super(name, amount, note, deadLine, loanType);
  }
}
