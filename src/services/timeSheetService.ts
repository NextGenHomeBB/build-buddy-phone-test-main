import { supabase } from '@/integrations/supabase/client';

export const timeSheetService = {
  async getTimeSheets(userId: string, filters?: any) {
    // Using time_entries table which exists in the database
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        project:projects(name)
      `)
      .eq('user_id', userId);

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTimeSheet(timeSheet: any) {
    const { data, error } = await supabase
      .from('time_entries')
      .insert(timeSheet)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTimeSheet(id: string, updates: any) {
    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTimeSheet(id: string) {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Simplified compatibility methods - return placeholder data
  async getEntriesByDate(date: string) {
    return [];
  },

  async createEntry(entryData: any) {
    return {
      id: 'placeholder',
      date: new Date(),
      hours: 0,
      notes: '',
      projectId: 'placeholder',
      userId: 'placeholder',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  async updateEntry(id: string, updates: any) {
    return {
      id: 'placeholder',
      date: new Date(),
      hours: 0,
      notes: '',
      projectId: 'placeholder',
      userId: 'placeholder',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  async deleteEntry(id: string) {
    // Placeholder implementation
  }
};