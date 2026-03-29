import {make, Brand} from 'ts-brand';

export type UnixTimeStampString = Brand<string, 'UnixTimeStampString'>;

export const BrandUnixTimeStamp = make<UnixTimeStampString>();

export function makeUnixTimestampToISOString(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  return date.toISOString();
}

export const makeUnixTimestampString = (
  timestamp: number,
): UnixTimeStampString => {
  return BrandUnixTimeStamp(String(Math.floor(timestamp / 1000)));
};

export function makeUnixTimestampToNumber(unixTimestamp: number): number {
  const date = unixTimestamp * 1000;
  return date;
}
