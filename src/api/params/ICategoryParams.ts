import { UserId } from "@trackingPortal/api/primitives";

export interface ICreateCategoryParams {
  name: string;
  icon: string;
  color: string;
  userId: UserId;
}

export interface IUpdateCategoryParams {
  name: string;
  icon: string;
  color: string;
  userId: UserId;
}
