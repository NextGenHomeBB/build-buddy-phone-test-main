import { supabase } from '@/integrations/supabase/client';

export const materialService = {
  async getMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async createMaterial(material: any) {
    const { data, error } = await supabase
      .from('materials')
      .insert(material)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMaterial(id: string, updates: any) {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMaterial(id: string) {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};