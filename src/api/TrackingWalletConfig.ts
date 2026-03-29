import {URLString} from '@trackingPortal/api/primitives/URLString';

export class TrackingWalletConfig {
  constructor(public baseUrl: URLString) {
    this.baseUrl = baseUrl;
  }
}
