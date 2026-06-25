import { ApiGateway } from "@trackingPortal/api/implementations";

/**
 * Single shared ApiGateway instance for the whole app. Both StoreProvider
 * (which sets the auth token provider on it) and the offline DatabaseProvider /
 * SyncEngine import this same instance, so the sync layer reuses the
 * authenticated transport without depending on React context ordering.
 */
export const apiGateway = new ApiGateway();
