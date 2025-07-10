import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MaterialCost {
  id: string;
  phase_id: string;
  category: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
  created_at: string;
  updated_at: string;
}

interface LabourCost {
  id: string;
  phase_id: string;
  task: string;
  subcontractor_id: string | null;
  hours: number;
  rate: number;
  total: number;
  created_at: string;
  updated_at: string;
}

interface PhaseCosts {
  materialCosts: MaterialCost[];
  labourCosts: LabourCost[];
  totalMaterial: number;
  totalLabour: number;
  remainingBudget: number;
}

interface MaterialCostDto {
  phase_id: string;
  category: string;
  qty: number;
  unit: string;
  unit_price: number;
}

interface LabourCostDto {
  phase_id: string;
  task: string;
  subcontractor_id?: string;
  hours: number;
  rate: number;
}

interface CostEstimate {
  materials: number;
  labour: number;
}

// Fetch phase costs data
export const fetchPhaseCosts = async (phaseId: string): Promise<PhaseCosts> => {
  try {
    // Fetch material costs
    const { data: materialCosts, error: materialError } = await supabase
      .from('material_costs')
      .select('*')
      .eq('phase_id', phaseId);

    if (materialError) {
      throw { code: materialError.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN', 
              message: materialError.message };
    }

    // Fetch labour costs
    const { data: labourCosts, error: labourError } = await supabase
      .from('labour_costs')
      .select('*')
      .eq('phase_id', phaseId);

    if (labourError) {
      throw { code: labourError.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN',
              message: labourError.message };
    }

    // Fetch project remaining budget
    const { data: phaseData, error: phaseError } = await supabase
      .from('project_phases')
      .select('project_id')
      .eq('id', phaseId)
      .single();

    if (phaseError) {
      throw { code: phaseError.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN',
              message: phaseError.message };
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('remaining_budget')
      .eq('id', phaseData.project_id)
      .single();

    if (projectError) {
      throw { code: projectError.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN',
              message: projectError.message };
    }

    const totalMaterial = materialCosts?.reduce((sum, cost) => sum + cost.total, 0) || 0;
    const totalLabour = labourCosts?.reduce((sum, cost) => sum + cost.total, 0) || 0;

    return {
      materialCosts: materialCosts || [],
      labourCosts: labourCosts || [],
      totalMaterial,
      totalLabour,
      remainingBudget: projectData.remaining_budget || 0
    };
  } catch (error: any) {
    if (error.code) throw error;
    throw { code: 'NETWORK', message: 'Failed to fetch phase costs' };
  }
};

// React Query hook
export const usePhaseCosts = (phaseId: string) => {
  return useQuery({
    queryKey: ['phase-costs', phaseId],
    queryFn: () => fetchPhaseCosts(phaseId),
    enabled: !!phaseId,
  });
};

// Insert material cost with optimistic update
export const insertMaterialCost = async (dto: MaterialCostDto): Promise<MaterialCost> => {
  try {
    const total = dto.qty * dto.unit_price;
    const newCost = { ...dto, total };

    const { data, error } = await supabase
      .from('material_costs')
      .insert(newCost)
      .select()
      .single();

    if (error) {
      throw { code: error.code === 'PGRST116' ? 'RLS_DENIED' : 'VALIDATION',
              message: error.message };
    }

    // Update remaining budget
    const { data: phaseData } = await supabase
      .from('project_phases')
      .select('project_id')
      .eq('id', dto.phase_id)
      .single();

    if (phaseData) {
      await supabase.rpc('update_remaining_budget', {
        project_id: phaseData.project_id,
        amount_delta: -total
      });
    }

    return data;
  } catch (error: any) {
    if (error.code) throw error;
    throw { code: 'NETWORK', message: 'Failed to insert material cost' };
  }
};

// Insert labour cost with optimistic update
export const insertLabourCost = async (dto: LabourCostDto): Promise<LabourCost> => {
  try {
    const total = dto.hours * dto.rate;
    const newCost = { ...dto, total };

    const { data, error } = await supabase
      .from('labour_costs')
      .insert(newCost)
      .select()
      .single();

    if (error) {
      throw { code: error.code === 'PGRST116' ? 'RLS_DENIED' : 'VALIDATION',
              message: error.message };
    }

    // Update remaining budget
    const { data: phaseData } = await supabase
      .from('project_phases')
      .select('project_id')
      .eq('id', dto.phase_id)
      .single();

    if (phaseData) {
      await supabase.rpc('update_remaining_budget', {
        project_id: phaseData.project_id,
        amount_delta: -total
      });
    }

    return data;
  } catch (error: any) {
    if (error.code) throw error;
    throw { code: 'NETWORK', message: 'Failed to insert labour cost' };
  }
};

// AI cost estimation
export const estimatePhaseCosts = async (phaseId: string): Promise<CostEstimate> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-cost-estimate', {
      body: { phase_id: phaseId }
    });

    if (error) {
      throw { code: 'NETWORK', message: 'AI estimation service unavailable' };
    }

    return {
      materials: data?.materials || 0,
      labour: data?.labour || 0
    };
  } catch (error: any) {
    if (error.code) throw error;
    throw { code: 'NETWORK', message: 'Failed to estimate phase costs' };
  }
};

// Mutation hooks
export const useInsertMaterialCost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: insertMaterialCost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phase-costs', data.phase_id] });
    },
  });
};

export const useInsertLabourCost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: insertLabourCost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phase-costs', data.phase_id] });
    },
  });
};

export const useEstimatePhaseCosts = () => {
  return useMutation({
    mutationFn: estimatePhaseCosts,
  });
};