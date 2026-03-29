import {URLString, UserId} from '@trackingPortal/api/primitives';

export interface IAddUserParams {
  userId: UserId;
  name: string;
  email: string;
  profilePicture: URLString;
}
