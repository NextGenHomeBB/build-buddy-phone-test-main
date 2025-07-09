import { supabase } from '@/integrations/supabase/client';
import { SyncRecord } from './idbClient';

export class SupabaseRealtime {
  private channels: Map<string, any> = new Map();
  private readonly syncTables = ['projects', 'phases', 'tasks', 'phaseChecks', 'subcontractors'];
  
  constructor(
    private onRealtimeChange: (table: string, payload: any) => Promise<void>
  ) {}

  async observeTable(table: string) {
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
          await this.onRealtimeChange(table, payload);
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription for ${table}:`, status);
      });

    this.channels.set(table, channel);
  }

  async syncOutboxItem(table: string, operation: 'insert' | 'update' | 'delete', data: any) {
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

  destroy() {
    // Cleanup subscriptions
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}