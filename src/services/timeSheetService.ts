import { supabase } from '@/integrations/supabase/client';

export const timeSheetService = {
  async getTimeSheets(userId: string, filters?: any) {
    let query = supabase
      .from('time_sheets')
      .select(`
        *,
        project:projects(name),
        task:tasks(title)
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
      .from('time_sheets')
      .insert(timeSheet)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTimeSheet(id: string, updates: any) {
    const { data, error } = await supabase
      .from('time_sheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTimeSheet(id: string) {
    const { error } = await supabase
      .from('time_sheets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Compatibility methods for existing hooks
  async getEntriesByDate(date: string) {
    const { data, error } = await supabase
      .from('time_sheets')
      .select(`
        *,
        project:projects(name),
        task:tasks(title)
      `)
      .eq('date', date);
    
    if (error) throw error;
    // Transform to match expected interface
    return data.map(entry => ({
      id: entry.id,
      date: new Date(entry.date),
      hours: entry.hours,
      notes: entry.description || '',
      projectId: entry.project_id,
      userId: entry.user_id,
      createdAt: new Date(entry.created_at),
      updatedAt: new Date(entry.updated_at)
    }));
  },

  async createEntry(entryData: any) {
    const { data, error } = await supabase
      .from('time_sheets')
      .insert({
        date: entryData.date instanceof Date ? entryData.date.toISOString().split('T')[0] : entryData.date,
        hours: entryData.hours,
        description: entryData.notes,
        project_id: entryData.projectId,
        user_id: entryData.userId || 'current_user' // Should get from auth context
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to expected interface
    return {
      id: data.id,
      date: new Date(data.date),
      hours: data.hours,
      notes: data.description || '',
      projectId: data.project_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateEntry(id: string, updates: any) {
    const { data, error } = await supabase
      .from('time_sheets')
      .update({
        hours: updates.hours,
        description: updates.notes
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to expected interface
    return {
      id: data.id,
      date: new Date(data.date),
      hours: data.hours,
      notes: data.description || '',
      projectId: data.project_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteEntry(id: string) {
    const { error } = await supabase
      .from('time_sheets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};