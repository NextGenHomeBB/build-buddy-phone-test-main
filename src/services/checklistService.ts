import { supabase } from '@/integrations/supabase/client';

export const checklistService = {
  async getChecklists() {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async createChecklist(checklist: any) {
    const { data, error } = await supabase
      .from('checklists')
      .insert(checklist)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateChecklist(id: string, updates: any) {
    const { data, error } = await supabase
      .from('checklists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteChecklist(id: string) {
    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};