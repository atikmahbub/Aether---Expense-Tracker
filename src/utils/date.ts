import { makeUnixTimestampString } from '@trackingPortal/api/primitives/UnixTimeStampString';
import dayjs from 'dayjs';

export const getMonthTimestamp = (year: number, month: number) => {
  return makeUnixTimestampString(
    Number(
      dayjs()
        .year(year)
        .month(month) // 0-based
        .date(1)
        .hour(12)
        .minute(0)
        .second(0)
        .millisecond(0)
        .toDate()
    )
  );
};

export const parseDate = (value: any): Date => {
  const num = Number(value)

  if (num < 1e12) {
    return new Date(num * 1000)
  }

  return new Date(num)
}
