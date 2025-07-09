import { openDB, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

// Simple interface for our sync database
interface SyncRecord {
  id: string;
  data: any;
  updated_at: string;
  synced: boolean;
  operation: 'insert' | 'update' | 'delete';
}

interface OutboxRecord {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

class SyncService {
  private db: IDBPDatabase | null = null;
  private channels: Map<string, any> = new Map();
  private isOnline = navigator.onLine;
  private syncInterval: number | null = null;
  private initialized = false;
  private readonly syncTables = ['projects', 'phases', 'tasks', 'phaseChecks', 'subcontractors'];

  async init() {
    if (this.initialized) return;

    try {
      // Open IndexedDB with simpler approach
      this.db = await openDB('construction-sync', 1, {
        upgrade(db) {
          // Create object stores for each sync table
          const syncTables = ['projects', 'phases', 'tasks', 'phaseChecks', 'subcontractors'];
          
          syncTables.forEach(tableName => {
            if (!db.objectStoreNames.contains(tableName)) {
              const store = db.createObjectStore(tableName, { keyPath: 'id' });
              store.createIndex('updated_at', 'updated_at');
              store.createIndex('synced', 'synced');
            }
          });

          // Create outbox for offline operations
          if (!db.objectStoreNames.contains('outbox')) {
            const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' });
            outboxStore.createIndex('timestamp', 'timestamp');
            outboxStore.createIndex('table', 'table');
          }
        },
      });

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
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    // Remove existing channel if it exists
    if (this.channels.has(table)) {
      supabase.removeChannel(this.channels.get(table));
    }

    // Create new realtime channel
    const channel = supabase
      .channel(`sync-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        async (payload) => {
          await this.handleRealtimeChange(table, payload);
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription for ${table}:`, status);
      });

    this.channels.set(table, channel);
  }

  private async handleRealtimeChange(table: string, payload: any) {
    if (!this.db) return;

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
        const tx = this.db.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        await store.put(storeData);
        await tx.done;

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
    if (!this.db) return;

    const outboxItem: OutboxRecord = {
      id: crypto.randomUUID(),
      table,
      operation,
      data,
      timestamp: new Date().toISOString(),
    };

    try {
      const tx = this.db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      await store.add(outboxItem);
      await tx.done;

      // Try immediate sync if online
      if (this.isOnline) {
        this.syncOutbox();
      }
    } catch (error) {
      console.error('Error adding to outbox:', error);
    }
  }

  async syncOutbox() {
    if (!this.db || !this.isOnline) return;

    try {
      const tx = this.db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const outboxItems = await store.getAll();
      await tx.done;

      for (const item of outboxItems) {
        try {
          await this.syncOutboxItem(item);
          
          // Remove from outbox after successful sync
          const deleteTx = this.db.transaction('outbox', 'readwrite');
          const deleteStore = deleteTx.objectStore('outbox');
          await deleteStore.delete(item.id);
          await deleteTx.done;

        } catch (error) {
          console.error(`Failed to sync outbox item ${item.id}:`, error);
          // Keep item in outbox for retry
        }
      }
    } catch (error) {
      console.error('Error syncing outbox:', error);
    }
  }

  private async syncOutboxItem(item: OutboxRecord) {
    const { table, operation, data } = item;

    switch (operation) {
      case 'insert':
        const { error: insertError } = await (supabase as any)
          .from(table)
          .insert(data);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await (supabase as any)
          .from(table)
          .update(data)
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await (supabase as any)
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  async getOfflineData(table: string, filter?: any) {
    if (!this.db) return [];

    try {
      if (!this.syncTables.includes(table)) return [];
      
      const tx = this.db.transaction(table, 'readonly');
      const store = tx.objectStore(table);
      const allItems = await store.getAll();
      await tx.done;

      // Filter out deleted items and apply any additional filters
      let filteredItems = (allItems as SyncRecord[])
        .filter(item => item.operation !== 'delete')
        .map(item => item.data);

      // Apply basic filters if provided
      if (filter) {
        Object.keys(filter).forEach(key => {
          filteredItems = filteredItems.filter(item => item[key] === filter[key]);
        });
      }

      return filteredItems;
    } catch (error) {
      console.error(`Error getting offline data for ${table}:`, error);
      return [];
    }
  }

  async storeOfflineData(table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'insert') {
    if (!this.db) return;

    const storeData: SyncRecord = {
      id: data.id || crypto.randomUUID(),
      data,
      updated_at: new Date().toISOString(),
      synced: false,
      operation,
    };

    try {
      if (!this.syncTables.includes(table)) return;
      
      const tx = this.db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      await store.put(storeData);
      await tx.done;

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
    if (!this.db) return;

    try {
      if (!this.syncTables.includes(table)) return;
      
      const tx = this.db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      await store.clear();
      await tx.done;
    } catch (error) {
      console.error(`Error clearing table ${table}:`, error);
    }
  }

  async getConnectionStatus() {
    return {
      online: this.isOnline,
      initialized: this.initialized,
      pendingSync: this.db ? await this.getPendingSyncCount() : 0,
    };
  }

  private async getPendingSyncCount() {
    if (!this.db) return 0;

    try {
      const tx = this.db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const count = await store.count();
      await tx.done;
      return count;
    } catch {
      return 0;
    }
  }

  destroy() {
    // Cleanup subscriptions
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();

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
