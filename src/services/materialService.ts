// Material service - temporarily simplified due to table structure mismatch
import { supabase } from '@/integrations/supabase/client';

export interface MaterialFilters {
  search: string;
  category: string;
  priceRange: [number, number];
  brand: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  price_per_unit: number;
  brand?: string;
  ean?: string;
  article_nr?: string;
  specs?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

class MaterialService {
  async getProjectMaterials(projectId: string): Promise<Material[]> {
    console.warn('Material service temporarily disabled - table structure mismatch');
    return [];
  }

  async addMaterial(material: Partial<Material>): Promise<void> {
    console.warn('Material service temporarily disabled - table structure mismatch');
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<void> {
    console.warn('Material service temporarily disabled - table structure mismatch');
  }

  async deleteMaterial(id: string): Promise<void> {
    console.warn('Material service temporarily disabled - table structure mismatch');
  }

  async getMaterialCatalog(): Promise<Material[]> {
    console.warn('Material service temporarily disabled - table structure mismatch');
    return [];
  }

  async getMaterialsPaginated(page: number, pageSize: number, filters: any): Promise<{ data: Material[], total: number }> {
    console.warn('Material service temporarily disabled - table structure mismatch');
    return { data: [], total: 0 };
  }

  async createMaterial(material: Partial<Material>): Promise<void> {
    console.warn('Material service temporarily disabled - table structure mismatch');
  }

  async enhanceMaterialData(data: any): Promise<any> {
    console.warn('Material service temporarily disabled - table structure mismatch');
    return data;
  }
}

export const materialService = new MaterialService();