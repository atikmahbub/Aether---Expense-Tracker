import {URLString, UserId} from '@trackingPortal/api/primitives';

export interface IUpdateUserParams {
  userId: UserId;
  name?: string;
  profilePicture?: URLString;
}
