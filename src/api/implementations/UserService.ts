import {TrackingWalletConfig} from '@trackingPortal/api/TrackingWalletConfig';

import {IAddUserParams, IUpdateUserParams} from '@trackingPortal/api/params';
import {IAxiosAjaxUtils} from '@trackingPortal/api/utils/IAxiosAjaxUtils';
import {urlJoin} from 'url-join-ts';
import {IUserService} from '@trackingPortal/api/interfaces';
import {UserModel} from '@trackingPortal/api/models/User';
import {UserId} from '@trackingPortal/api/primitives';

export class UserService implements IUserService {
  constructor(
    protected config: TrackingWalletConfig,
    protected ajaxUtils: IAxiosAjaxUtils,
  ) {}

  async addUser(params: IAddUserParams): Promise<UserModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'user', 'add'));

    const response = await this.ajaxUtils.post(url, {...params});

    if (response.isOk()) {
      return response.value as UserModel;
    }
    throw new Error(response.error);
  }

  async getUser(userId: UserId): Promise<UserModel> {
    const url = new URL(urlJoin(this.config.baseUrl, 'v0', 'user', userId));
    const response = await this.ajaxUtils.get(url);
    if (response.isOk()) {
      return response.value as UserModel;
    }
    throw new Error(response.error);
  }

  async updateUser(params: IUpdateUserParams): Promise<UserModel> {
    const url = new URL(
      urlJoin(this.config.baseUrl, 'v0', 'user', params.userId),
    );
    const response = await this.ajaxUtils.put(url, {...params});
    if (response.isOk()) {
      return response.value as UserModel;
    }
    throw new Error(response.error);
  }
}
