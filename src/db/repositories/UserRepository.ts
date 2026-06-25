import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";

export interface LocalUser {
  id: string;
  serverId: string | null;
  name: string | null;
  email: string | null;
  profilePicture: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  syncStatus: string;
}

/**
 * The user profile. The Auth0 `sub` is the stable identity, so it is used as
 * both the local `id` and the `serverId` — there is no separate generated id to
 * reconcile.
 */
export class UserRepository extends BaseRepository<LocalUser> {
  protected readonly table = "users";
  protected readonly entity: EntityName = "user";
  protected readonly entityColumns = ["name", "email", "profilePicture"];

  protected toModel(row: Row): LocalUser {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      name: row.name ?? null,
      email: row.email ?? null,
      profilePicture: row.profilePicture ?? null,
      createdAt: row.createdAt ?? null,
      updatedAt: row.updatedAt ?? null,
      syncStatus: row.syncStatus,
    };
  }

  protected fromServer(model: any): ServerMapping {
    return {
      serverId: String(model.userId),
      userId: String(model.userId),
      createdAt: model.created ?? null,
      updatedAt: model.updated ?? null,
      columns: {
        name: model.name ?? null,
        email: model.email ?? null,
        profilePicture: model.profilePicture ?? null,
      },
    };
  }

  async getProfile(userId: string): Promise<LocalUser | null> {
    const row = await this.getRowByServerId(userId);
    return row ? this.toModel(row) : null;
  }
}
