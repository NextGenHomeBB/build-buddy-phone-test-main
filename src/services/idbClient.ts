import { openDB, IDBPDatabase } from 'idb';

// Simple interface for our sync database
export interface SyncRecord {
  id: string;
  data: any;
  updated_at: string;
  synced: boolean;
  operation: 'insert' | 'update' | 'delete';
}

export interface OutboxRecord {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export class IDBClient {
  private db: IDBPDatabase | null = null;
  private readonly syncTables = ['projects', 'phases', 'tasks', 'phaseChecks', 'subcontractors'];

  async init() {
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

      console.log('IDBClient initialized');
    } catch (error) {
      console.error('Failed to initialize IDBClient:', error);
      throw error;
    }
  }

  async storeSyncRecord(table: string, record: SyncRecord) {
    if (!this.db || !this.syncTables.includes(table)) return;

    try {
      const tx = this.db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      await store.put(record);
      await tx.done;
    } catch (error) {
      console.error(`Error storing sync record for ${table}:`, error);
      throw error;
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
      return outboxItem;
    } catch (error) {
      console.error('Error adding to outbox:', error);
      throw error;
    }
  }

  async getAllOutboxItems(): Promise<OutboxRecord[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const outboxItems = await store.getAll();
      await tx.done;
      return outboxItems;
    } catch (error) {
      console.error('Error getting outbox items:', error);
      return [];
    }
  }

  async removeFromOutbox(id: string) {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      await store.delete(id);
      await tx.done;
    } catch (error) {
      console.error('Error removing from outbox:', error);
      throw error;
    }
  }

  async getOfflineData(table: string, filter?: any) {
    if (!this.db || !this.syncTables.includes(table)) return [];

    try {
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
    if (!this.db || !this.syncTables.includes(table)) return;

    const storeData: SyncRecord = {
      id: data.id || crypto.randomUUID(),
      data,
      updated_at: new Date().toISOString(),
      synced: false,
      operation,
    };

    try {
      const tx = this.db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      await store.put(storeData);
      await tx.done;
      return storeData;
    } catch (error) {
      console.error(`Error storing offline data for ${table}:`, error);
      throw error;
    }
  }

  async clearTable(table: string) {
    if (!this.db || !this.syncTables.includes(table)) return;

    try {
      const tx = this.db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      await store.clear();
      await tx.done;
    } catch (error) {
      console.error(`Error clearing table ${table}:`, error);
      throw error;
    }
  }

  async getPendingSyncCount() {
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

  get isInitialized() {
    return this.db !== null;
  }
}