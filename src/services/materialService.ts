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

// Smart categorization patterns
const categoryPatterns = {
  'Concrete': ['cement', 'concrete', 'aggregate', 'sand', 'gravel'],
  'Steel': ['steel', 'rebar', 'beam', 'plate', 'angle', 'channel'],
  'Lumber': ['lumber', 'wood', 'timber', 'plywood', 'osb', 'mdf'],
  'Electrical': ['wire', 'cable', 'outlet', 'switch', 'breaker', 'conduit'],
  'Plumbing': ['pipe', 'fitting', 'valve', 'faucet', 'toilet', 'sink'],
  'Roofing': ['shingle', 'tile', 'membrane', 'flashing', 'gutter'],
  'Insulation': ['insulation', 'foam', 'fiberglass', 'cellulose'],
  'Interior': ['drywall', 'paint', 'flooring', 'trim', 'door', 'window'],
  'Hardware': ['screw', 'nail', 'bolt', 'bracket', 'hinge', 'lock'],
  'Tools': ['drill', 'saw', 'hammer', 'wrench', 'level', 'measuring']
};

// Smart unit detection patterns
const unitPatterns = {
  'pieces': ['piece', 'each', 'unit', 'item'],
  'linear feet': ['foot', 'feet', 'ft', 'linear'],
  'square feet': ['sq ft', 'sqft', 'square'],
  'cubic yards': ['yard', 'yd', 'cubic'],
  'bags': ['bag', 'sack'],
  'sheets': ['sheet', 'panel'],
  'rolls': ['roll'],
  'board feet': ['bf', 'board'],
  'kg': ['kilogram', 'kilo'],
  'm': ['meter', 'metre'],
  'litres': ['litre', 'liter', 'l']
};

function smartCategorize(name: string): string {
  const lowerName = name.toLowerCase();
  
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(pattern => lowerName.includes(pattern))) {
      return category;
    }
  }
  
  return 'General';
}

function smartDetectUnit(name: string): string {
  const lowerName = name.toLowerCase();
  
  for (const [unit, patterns] of Object.entries(unitPatterns)) {
    if (patterns.some(pattern => lowerName.includes(pattern))) {
      return unit;
    }
  }
  
  return 'pieces';
}

function extractBrand(name: string): string | null {
  // Common brand patterns - this could be expanded
  const brandPatterns = [
    /^([A-Z][a-z]+)\s/,  // First capitalized word
    /\b([A-Z]{2,})\b/,   // All caps words
  ];
  
  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

export const materialService = {
  async getMaterials(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getMaterialsPaginated(page: number = 1, pageSize: number = 20, filters: MaterialFilters) {
    // Use fallback implementation for now
    return await this.getMaterialsPaginatedFallback(page, pageSize, filters);
  },

  async getMaterialsPaginatedFallback(page: number, pageSize: number, filters: MaterialFilters) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('materials')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('name');

    if (error) throw error;

    return {
      materials: data || [],
      totalCount: count || 0,
      page,
      pageSize
    };
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = [...new Set((data as any)?.map((item: any) => item.category).filter(Boolean))] as string[];
    return categories.sort();
  },

  async getBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('brand')
      .not('brand', 'is', null);

    if (error) throw error;

    const brands = [...new Set((data as any)?.map((item: any) => item.brand).filter(Boolean))] as string[];
    return brands.sort();
  },

  async createMaterial(material: Partial<Material>): Promise<Material> {
    // Auto-enhance the material data
    const enhancedMaterial: any = {
      name: material.name || '',
      description: material.description,
      category: material.category || smartCategorize(material.name || ''),
      unit: material.unit || smartDetectUnit(material.name || ''),
      brand: material.brand || extractBrand(material.name || ''),
      price_per_unit: parseFloat(material.price_per_unit?.toString() || '0') || 0,
      ean: material.ean,
      article_nr: material.article_nr,
      specs: material.specs,
      url: material.url
    };

    const { data, error } = await supabase
      .from('materials')
      .insert(enhancedMaterial)
      .select()
      .single();
    
    if (error) throw error;
    return data as Material;
  },

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMaterial(id: string): Promise<void> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async enhanceMaterialData(id: string): Promise<Material> {
    // Get the material
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Auto-enhance missing data
    const enhancements: Partial<Material> = {};

    if (!(material as any).category) {
      enhancements.category = smartCategorize(material.name);
    }

    if (!material.unit) {
      enhancements.unit = smartDetectUnit(material.name);
    }

    if (!(material as any).brand) {
      const detectedBrand = extractBrand(material.name);
      if (detectedBrand) {
        enhancements.brand = detectedBrand;
      }
    }

    // Only update if we have enhancements
    if (Object.keys(enhancements).length > 0) {
      const { data, error } = await supabase
        .from('materials')
        .update(enhancements)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return material;
  },

  async bulkEnhanceMaterials(limit: number = 100): Promise<number> {
    // Get materials missing key data
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .or('category.is.null,brand.is.null')
      .limit(limit);

    if (error) throw error;

    let updatedCount = 0;

    for (const material of materials || []) {
      const enhancements: Partial<Material> = {};

      if (!(material as any).category) {
        enhancements.category = smartCategorize(material.name);
      }

      if (!(material as any).brand) {
        const detectedBrand = extractBrand(material.name);
        if (detectedBrand) {
          enhancements.brand = detectedBrand;
        }
      }

      if (Object.keys(enhancements).length > 0) {
        await this.updateMaterial(material.id, enhancements);
        updatedCount++;
      }
    }

    return updatedCount;
  }
};