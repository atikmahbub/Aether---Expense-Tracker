import { IApiGateWay } from "@trackingPortal/api/interfaces";
import { OfflineQueueItem, offlineService } from "@trackingPortal/api/utils/OfflineService";
import Toast from "react-native-toast-message";

export class OfflineSyncService {
  constructor(private apiGateway: IApiGateWay) {}

  async syncItems(): Promise<{ success: number; failed: number }> {
    const queue = await offlineService.getQueue();
    const unsyncedItems = queue.filter((item) => !item.synced);

    if (unsyncedItems.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;

    for (const item of unsyncedItems) {
      const isSuccess = await this.processItem(item);
      if (isSuccess) {
        successCount++;
        await offlineService.removeItem(item.id);
      } else {
        failedCount++;
      }
    }

    if (successCount > 0) {
      Toast.show({
        type: "success",
        text1: "Sync Complete",
        text2: `${successCount} items synced successfully`,
      });
    }

    if (failedCount > 0) {
      Toast.show({
        type: "error",
        text1: "Sync Incomplete",
        text2: `${failedCount} items failed to sync`,
      });
    }

    return { success: successCount, failed: failedCount };
  }

  private async processItem(item: OfflineQueueItem): Promise<boolean> {
    try {
      switch (item.type) {
        case "expense":
          await this.apiGateway.expenseService.addExpense(item.payload);
          return true;
        case "loan":
          await this.apiGateway.loanServices.addLoan(item.payload);
          return true;
        case "invest":
          await this.apiGateway.investService.addInvest(item.payload);
          return true;
        default:
          console.warn(`Unknown entity type: ${item.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error syncing ${item.type}:`, error);
      return false;
    }
  }
}
