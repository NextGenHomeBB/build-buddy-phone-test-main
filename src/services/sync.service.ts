import { IDBClient, SyncRecord, OutboxRecord } from './idbClient';
import { SupabaseRealtime } from './supabaseRealtime';

class SyncService {
  private idbClient = new IDBClient();
  private supabaseRealtime: SupabaseRealtime;
  private isOnline = navigator.onLine;
  private syncInterval: number | null = null;
  private initialized = false;
  private readonly syncTables = ['projects', 'phases', 'tasks', 'phaseChecks', 'subcontractors'];

  constructor() {
    this.supabaseRealtime = new SupabaseRealtime(this.handleRealtimeChange.bind(this));
  }

  async init() {
    if (this.initialized) return;

    try {
      await this.idbClient.init();

      // Setup online/offline detection
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Start background sync
      this.startBackgroundSync();

      this.initialized = true;
      console.log('SyncService initialized');
    } catch (error) {
      console.error('Failed to initialize SyncService:', error);
    }
  }

  private handleOnline() {
    this.isOnline = true;
    console.log('Connection restored - starting sync');
    this.syncOutbox();
  }

  private handleOffline() {
    this.isOnline = false;
    console.log('Connection lost - switching to offline mode');
  }

  private startBackgroundSync() {
    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.syncOutbox();
      }
    }, 30000);
  }

  async observeSupabase(table: string) {
    if (!this.idbClient.isInitialized) {
      console.error('Database not initialized');
      return;
    }

    await this.supabaseRealtime.observeTable(table);
  }

  private async handleRealtimeChange(table: string, payload: any) {
    if (!this.idbClient.isInitialized) return;

    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const timestamp = new Date().toISOString();

      let operation: 'insert' | 'update' | 'delete';
      let data: any;
      let id: string;

      switch (eventType) {
        case 'INSERT':
          operation = 'insert';
          data = newRecord;
          id = newRecord.id;
          break;
        case 'UPDATE':
          operation = 'update';
          data = newRecord;
          id = newRecord.id;
          break;
        case 'DELETE':
          operation = 'delete';
          data = oldRecord;
          id = oldRecord.id;
          break;
        default:
          return;
      }

      // Store in IndexedDB
      const storeData: SyncRecord = {
        id,
        data,
        updated_at: timestamp,
        synced: true, // Coming from server, so already synced
        operation,
      };

      // Only store in supported sync tables
      if (this.syncTables.includes(table)) {
        await this.idbClient.storeSyncRecord(table, storeData);

        // Emit custom event for UI updates
        window.dispatchEvent(new CustomEvent('sync-update', {
          detail: { table, operation, data: storeData }
        }));
      }

    } catch (error) {
      console.error(`Error handling realtime change for ${table}:`, error);
    }
  }

  async addToOutbox(table: string, operation: 'insert' | 'update' | 'delete', data: any) {
    if (!this.idbClient.isInitialized) return;

    try {
      await this.idbClient.addToOutbox(table, operation, data);

      // Try immediate sync if online
      if (this.isOnline) {
        this.syncOutbox();
      }
    } catch (error) {
      console.error('Error adding to outbox:', error);
    }
  }

  async syncOutbox() {
    if (!this.idbClient.isInitialized || !this.isOnline) return;

    try {
      const outboxItems = await this.idbClient.getAllOutboxItems();

      for (const item of outboxItems) {
        try {
          await this.supabaseRealtime.syncOutboxItem(item.table, item.operation, item.data);
          
          // Remove from outbox after successful sync
          await this.idbClient.removeFromOutbox(item.id);

        } catch (error) {
          console.error(`Failed to sync outbox item ${item.id}:`, error);
          // Keep item in outbox for retry
        }
      }
    } catch (error) {
      console.error('Error syncing outbox:', error);
    }
  }

  async getOfflineData(table: string, filter?: any) {
    return this.idbClient.getOfflineData(table, filter);
  }

  async storeOfflineData(table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'insert') {
    if (!this.idbClient.isInitialized) return;

    try {
      const storeData = await this.idbClient.storeOfflineData(table, data, operation);
      if (!storeData) return;

      // Add to outbox for later sync
      await this.addToOutbox(table, operation, data);

      // Emit update event
      window.dispatchEvent(new CustomEvent('sync-update', {
        detail: { table, operation, data: storeData }
      }));

    } catch (error) {
      console.error(`Error storing offline data for ${table}:`, error);
    }
  }

  async clearTable(table: string) {
    return this.idbClient.clearTable(table);
  }

  async getConnectionStatus() {
    return {
      online: this.isOnline,
      initialized: this.initialized,
      pendingSync: this.idbClient.isInitialized ? await this.idbClient.getPendingSyncCount() : 0,
    };
  }

  destroy() {
    // Cleanup realtime subscriptions
    this.supabaseRealtime.destroy();

    // Clear intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));

    this.initialized = false;
  }
}

// Singleton instance
const syncService = new SyncService();

export const startSync = async () => {
  await syncService.init();
  
  // Start observing sync tables
  const syncTables = ['projects', 'project_phases', 'tasks', 'profiles'];
  syncTables.forEach(table => {
    syncService.observeSupabase(table);
  });
};

export const addToSyncOutbox = syncService.addToOutbox.bind(syncService);
export const getOfflineData = syncService.getOfflineData.bind(syncService);
export const storeOfflineData = syncService.storeOfflineData.bind(syncService);
export const getSyncStatus = syncService.getConnectionStatus.bind(syncService);

export default syncService;
