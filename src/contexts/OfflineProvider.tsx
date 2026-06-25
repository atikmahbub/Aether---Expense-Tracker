import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNetwork } from './NetworkProvider';
import { offlineService } from '@trackingPortal/api/utils/OfflineService';
import { OfflineSyncService } from '@trackingPortal/api/implementations/OfflineSyncService';
import { useStoreContext } from './StoreProvider';
import { useDatabase } from '@trackingPortal/db/DatabaseProvider';
import { eventEmitter, EVENTS } from '@trackingPortal/utils/events';
import type { SyncProgress } from '@trackingPortal/db/sync/SyncEngine';

const INITIAL_SYNC_PREFIX = 'initial_sync_done_';

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  syncInProgress: boolean;
  /** True while the one-time first-launch migration sync is running. */
  isMigrating: boolean;
  /** Current migration progress (step label + 0–1 fraction). */
  migrationProgress: SyncProgress | null;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, isInternetReachable } = useNetwork();
  const { apiGateway, currentUser } = useStoreContext();
  const { syncEngine, outbox, repositories, ready: dbReady } = useDatabase();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<SyncProgress | null>(null);
  const migratedRef = useRef(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  const userId = currentUser?.default ? undefined : currentUser?.userId;
  const syncKey = userId ? `${INITIAL_SYNC_PREFIX}${userId}` : null;

  // Legacy AsyncStorage queue — still used by Loan/Invest creation until those
  // screens are migrated to the SQLite repositories.
  const legacySyncService = useMemo(() => new OfflineSyncService(apiGateway), [apiGateway]);

  const updatePendingCount = useCallback(async () => {
    const legacy = (await offlineService.getQueue()).filter(item => !item.synced).length;
    const outboxCount = outbox ? await outbox.count() : 0;
    setPendingCount(legacy + outboxCount);
  }, [outbox]);

  const syncNow = useCallback(async () => {
    if (syncInProgress) return;
    setSyncInProgress(true);
    try {
      // New SQLite sync (transactions + categories): push pending, pull cloud.
      if (syncEngine && userId) {
        await syncEngine.syncAll(userId);
      }
      // Legacy queue (loan / invest).
      await legacySyncService.syncItems();
      await updatePendingCount();
      eventEmitter.emit(EVENTS.OFFLINE_SYNC_COMPLETED);
    } catch (error) {
      console.log('sync error', error);
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress, syncEngine, userId, legacySyncService, updatePendingCount]);

  // Initial count update once the DB is ready.
  useEffect(() => {
    if (dbReady) updatePendingCount();
  }, [dbReady, updatePendingCount]);

  // First-launch migration: existing users open the new build with an empty
  // SQLite. The very first sync downloads their cloud data into SQLite; we show
  // a one-time migration screen while it runs (see MigrationOverlay). A flag is
  // persisted per user so this only ever happens once per account. If offline at
  // first launch, we wait and retry automatically when connectivity returns.
  useEffect(() => {
    if (!dbReady || !repositories || !userId || !syncEngine || !syncKey) return;
    if (isMigrating) return;

    if (prevUserIdRef.current !== userId) {
      migratedRef.current = false;
      prevUserIdRef.current = userId;
    }

    if (migratedRef.current) return;

    let cancelled = false;
    (async () => {
      const done = await repositories.settings.get(syncKey);
      if (cancelled) return;

      if (done === 'true') {
        migratedRef.current = true;
        if (isOnline && isInternetReachable) syncNow();
        return;
      }

      // First-ever sync still needed — requires internet.
      if (!isOnline || !isInternetReachable) return;

      setIsMigrating(true);
      try {
        await syncEngine.syncAll(userId, (p) => setMigrationProgress(p));
        await repositories.settings.set(syncKey, 'true');
        migratedRef.current = true;
        await updatePendingCount();
        eventEmitter.emit(EVENTS.OFFLINE_SYNC_COMPLETED);
      } catch (error) {
        console.log('migration sync error', error);
      } finally {
        if (!cancelled) {
          setMigrationProgress(null);
          setIsMigrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    dbReady,
    repositories,
    userId,
    syncKey,
    syncEngine,
    isOnline,
    isInternetReachable,
    syncNow,
    updatePendingCount,
  ]);

  // Auto-sync whenever connectivity returns with pending work.
  useEffect(() => {
    if (isOnline && isInternetReachable && pendingCount > 0 && !syncInProgress && !isMigrating) {
      syncNow();
    }
  }, [isOnline, isInternetReachable, pendingCount, syncInProgress, isMigrating, syncNow]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        syncInProgress,
        isMigrating,
        migrationProgress,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
