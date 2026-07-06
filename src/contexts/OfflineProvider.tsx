import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNetwork } from './NetworkProvider';
import { offlineService } from '@trackingPortal/api/utils/OfflineService';
import { OfflineSyncService } from '@trackingPortal/api/implementations/OfflineSyncService';
import { useStoreContext } from './StoreProvider';
import { useDatabase } from '@trackingPortal/db/DatabaseProvider';
import { useAuth } from '@trackingPortal/auth/Auth0ProviderWithHistory';
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
  const { getValidToken } = useAuth();
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

      // CRITICAL: ensure we actually have a valid access token before the first
      // cloud pull. On a fresh install the stored token may be expired and the
      // background refresh may not have completed yet — pulling now would 401 on
      // every entity and, because the pull is resilient, still finish and mark
      // migration "done" with EMPTY data (the "expense 0" bug). Wait for a valid
      // token; the effect re-runs once one is available (getValidToken is in deps).
      const validToken = await getValidToken();
      if (cancelled || !validToken) return;

      setIsMigrating(true);

      // Watchdog: the migration overlay must never hang. If it hasn't dismissed
      // within 30s, force it off — the sync (if still running) continues in the
      // background and will persist the flag when it finishes.
      const watchdog = setTimeout(() => {
        console.warn('migration watchdog fired — dismissing overlay');
        // Prevent the effect from re-entering and flashing the overlay back
        // while the (slow) sync keeps running in the background.
        migratedRef.current = true;
        setMigrationProgress(null);
        setIsMigrating(false);
      }, 30000);

      try {
        await syncEngine.syncAll(userId, (p) => setMigrationProgress(p), { full: true });
        // Only the flag persistence is essential before dismissing the overlay.
        await repositories.settings.set(syncKey, 'true');
        migratedRef.current = true;
      } catch (error) {
        console.log('migration sync error', error);
      } finally {
        clearTimeout(watchdog);
        if (!cancelled) {
          setMigrationProgress(null);
          setIsMigrating(false);
        }
      }

      // Housekeeping runs AFTER the overlay is dismissed and never blocks it —
      // a stall here (SQLite/AsyncStorage contention) was what pinned the
      // overlay on "Finalizing…".
      try {
        eventEmitter.emit(EVENTS.OFFLINE_SYNC_COMPLETED);
      } catch {}
      void updatePendingCount().catch(() => {});
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
    getValidToken,
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
