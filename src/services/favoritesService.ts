// Favorites service - temporarily disabled due to missing table
// This service would handle material favorites but the table doesn't exist yet

export interface MaterialFavorite {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
}

class FavoritesService {
  async toggleMaterialFavorite(materialId: string): Promise<{ isFavorite: boolean }> {
    // TODO: Implement when user_material_favorites table is created
    console.warn('Favorites feature not yet implemented - missing table');
    return { isFavorite: false };
  }

  async getUserFavorites(): Promise<string[]> {
    // TODO: Implement when user_material_favorites table is created
    return [];
  }

  async isMaterialFavorited(materialId: string): Promise<boolean> {
    // TODO: Implement when user_material_favorites table is created
    return false;
  }
}

export const favoritesService = new FavoritesService();