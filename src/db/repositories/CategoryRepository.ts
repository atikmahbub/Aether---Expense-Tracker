import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";

export interface LocalCategory {
  id: string;
  serverId: string | null;
  userId: string | null;
  kind: "expense" | "income";
  name: string;
  icon: string | null;
  color: string | null;
  syncStatus: string;
}

/**
 * Expense and income categories share one `categories` table, distinguished by
 * `kind`. Server models are fed tagged with their `kind`.
 */
export class CategoryRepository extends BaseRepository<LocalCategory> {
  protected readonly table = "categories";
  protected readonly entity: EntityName = "category";
  protected readonly entityColumns = ["kind", "name", "icon", "color"];

  protected toModel(row: Row): LocalCategory {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      userId: row.userId ?? null,
      kind: row.kind,
      name: row.name,
      icon: row.icon ?? null,
      color: row.color ?? null,
      syncStatus: row.syncStatus,
    };
  }

  protected fromServer(model: any): ServerMapping {
    return {
      serverId: String(model.id),
      userId: model.userId != null ? String(model.userId) : null,
      createdAt: model.created ?? null,
      updatedAt: model.updated ?? null,
      columns: {
        kind: model.kind,
        name: model.name,
        icon: model.icon ?? null,
        color: model.color ?? null,
      },
    };
  }

  getByKind(kind: "expense" | "income") {
    return this.getAll("kind = ?", [kind]);
  }
}
