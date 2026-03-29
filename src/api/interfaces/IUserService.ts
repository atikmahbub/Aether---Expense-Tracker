import {UserModel} from '@trackingPortal/api/models/User';
import {IAddUserParams, IUpdateUserParams} from '@trackingPortal/api/params';
import {UserId} from '@trackingPortal/api/primitives';

export interface IUserService {
  addUser: (params: IAddUserParams) => Promise<UserModel>;
  getUser: (userId: UserId) => Promise<UserModel>;
  updateUser: (params: IUpdateUserParams) => Promise<UserModel>;
}
