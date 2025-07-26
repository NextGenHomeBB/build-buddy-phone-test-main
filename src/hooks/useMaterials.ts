import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService } from '@/services/materialService';
import { toast } from '@/hooks/use-toast';

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

export interface MaterialFilters {
  search: string;
  category: string;
  priceRange: [number, number];
  brand: string;
}

export function useMaterials() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<MaterialFilters>({
    search: '',
    category: '',
    priceRange: [0, 1000],
    brand: ''
  });

  const { 
    data: materialsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['materials', page, pageSize, filters],
    queryFn: () => materialService.getMaterialsPaginated(page, pageSize, filters),
    placeholderData: (previousData) => previousData
  });

  const createMaterialMutation = useMutation({
    mutationFn: materialService.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: "Material created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating material", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Material> }) =>
      materialService.updateMaterial(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: "Material updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating material", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: materialService.deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: "Material deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting material", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const enhanceMaterialMutation = useMutation({
    mutationFn: materialService.enhanceMaterialData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: "Material data enhanced successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error enhancing material data", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  return {
    materials: materialsData?.materials || [],
    totalCount: materialsData?.totalCount || 0,
    totalPages: Math.ceil((materialsData?.totalCount || 0) / pageSize),
    currentPage: page,
    isLoading,
    error,
    filters,
    setFilters,
    setPage,
    createMaterial: createMaterialMutation.mutate,
    updateMaterial: updateMaterialMutation.mutate,
    deleteMaterial: deleteMaterialMutation.mutate,
    enhanceMaterial: enhanceMaterialMutation.mutate,
    isCreating: createMaterialMutation.isPending,
    isUpdating: updateMaterialMutation.isPending,
    isDeleting: deleteMaterialMutation.isPending,
    isEnhancing: enhanceMaterialMutation.isPending,
  };
}