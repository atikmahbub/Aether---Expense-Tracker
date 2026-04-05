import AsyncStorage from '@react-native-async-storage/async-storage';

export const OFFLINE_QUEUE_KEY = 'offline_queue';

export type OfflineEntityType = 'expense' | 'loan' | 'invest';

export interface OfflineQueueItem {
  id: string;
  type: OfflineEntityType;
  action: 'create';
  payload: any;
  createdAt: number;
  synced: boolean;
}

class OfflineService {
  async getQueue(): Promise<OfflineQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  async saveQueue(queue: OfflineQueueItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'synced'>): Promise<OfflineQueueItem> {
    const queue = await this.getQueue();
    const newItem: OfflineQueueItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      createdAt: Date.now(),
      synced: false,
    };
    queue.push(newItem);
    await this.saveQueue(queue);
    return newItem;
  }

  async updateItemStatus(id: string, synced: boolean): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index].synced = synced;
      await this.saveQueue(queue);
    }
  }

  async clearSyncedItems(): Promise<void> {
    const queue = await this.getQueue();
    const remaining = queue.filter(item => !item.synced);
    await this.saveQueue(remaining);
  }

  async removeItem(id: string): Promise<void> {
    const queue = await this.getQueue();
    const remaining = queue.filter(item => item.id !== id);
    await this.saveQueue(remaining);
  }
}

export const offlineService = new OfflineService();
