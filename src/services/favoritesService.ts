import { supabase } from '@/integrations/supabase/client';

export interface MaterialFavorite {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
}

class FavoritesService {
  async toggleMaterialFavorite(materialId: string): Promise<{ isFavorite: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_material_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('material_id', materialId)
      .single();

    if (existing) {
      // Remove from favorites
      await supabase
        .from('user_material_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('material_id', materialId);
      
      return { isFavorite: false };
    } else {
      // Add to favorites
      await supabase
        .from('user_material_favorites')
        .insert({
          user_id: user.id,
          material_id: materialId
        });
      
      return { isFavorite: true };
    }
  }

  async getUserFavorites(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_material_favorites')
      .select('material_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return data.map(fav => fav.material_id);
  }

  async isMaterialFavorited(materialId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('user_material_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('material_id', materialId)
      .single();

    return !!data;
  }
}

export const favoritesService = new FavoritesService();