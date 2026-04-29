import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNetwork } from './NetworkProvider';
import { offlineService, OfflineQueueItem, OfflineEntityType } from '@trackingPortal/api/utils/OfflineService';
import { OfflineSyncService } from '@trackingPortal/api/implementations/OfflineSyncService';
import { useStoreContext } from './StoreProvider';
import Toast from 'react-native-toast-message';
import { eventEmitter, EVENTS } from '@trackingPortal/utils/events';

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  syncInProgress: boolean;
  syncNow: () => Promise<void>;
  saveOffline: (type: OfflineEntityType, payload: any) => Promise<OfflineQueueItem>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, isInternetReachable } = useNetwork();
  const { apiGateway } = useStoreContext();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const syncService = useMemo(() => new OfflineSyncService(apiGateway), [apiGateway]);

  const updatePendingCount = useCallback(async () => {
    const queue = await offlineService.getQueue();
    setPendingCount(queue.filter(item => !item.synced).length);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncInProgress) return;
    setSyncInProgress(true);
    try {
      await syncService.syncItems();
      await updatePendingCount();
      eventEmitter.emit(EVENTS.OFFLINE_SYNC_COMPLETED);
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress, syncService, updatePendingCount]);

  const saveOffline = useCallback(async (type: OfflineEntityType, payload: any) => {
    const item = await offlineService.addToQueue({ type, action: 'create', payload });
    await updatePendingCount();
    Toast.show({
      type: 'info',
      text1: 'Saved Offline',
      text2: 'Data will sync when back online',
    });
    return item;
  }, [updatePendingCount]);

  // Initial count update
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && isInternetReachable && pendingCount > 0 && !syncInProgress) {
      syncNow();
    }
  }, [isOnline, isInternetReachable, pendingCount, syncInProgress, syncNow]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline: isOnline, // Use basic connectivity to avoid false offline banners
        pendingCount,
        syncInProgress,
        syncNow,
        saveOffline,
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
