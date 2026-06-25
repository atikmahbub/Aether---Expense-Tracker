import { nanoid } from "nanoid/non-secure";

/**
 * Generates a client-side primary key for a locally-created row.
 *
 * The Railway backend assigns its own ids on create, so offline-created rows
 * use one of these local ids until they are reconciled with a `serverId`
 * (see {@link BaseRepository.setServerId}).
 */
export const newLocalId = (): string => nanoid();
