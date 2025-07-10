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

export const fetchPhaseCosts = async (phaseId: string): Promise<PhaseCosts> => {
  try {
    const [materialResult, labourResult, phaseResult] = await Promise.all([
      supabase.from('material_costs').select('*').eq('phase_id', phaseId),
      supabase.from('labour_costs').select('*').eq('phase_id', phaseId),
      supabase.from('project_phases').select('project_id').eq('id', phaseId).single()
    ]);

    if (materialResult.error) {
      throw { code: materialResult.error.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN', 
              message: materialResult.error.message };
    }

    if (labourResult.error) {
      throw { code: labourResult.error.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN',
              message: labourResult.error.message };
    }

    if (phaseResult.error) {
      throw { code: phaseResult.error.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN',
              message: phaseResult.error.message };
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('remaining_budget')
      .eq('id', phaseResult.data.project_id)
      .single();

    if (projectError) {
      throw { code: projectError.code === 'PGRST116' ? 'RLS_DENIED' : 'UNKNOWN',
              message: projectError.message };
    }

    const materialCosts = materialResult.data || [];
    const labourCosts = labourResult.data || [];
    const totalMaterial = materialCosts.reduce((sum, cost) => sum + cost.total, 0);
    const totalLabour = labourCosts.reduce((sum, cost) => sum + cost.total, 0);

    return {
      materialCosts,
      labourCosts,
      totalMaterial,
      totalLabour,
      remainingBudget: projectData.remaining_budget || 0
    };
  } catch (error: any) {
    if (error.code) throw error;
    throw { code: 'NETWORK', message: 'Failed to fetch phase costs' };
  }
};

export const usePhaseCosts = (phaseId: string) => {
  return useQuery({
    queryKey: ['phase-costs', phaseId],
    queryFn: () => fetchPhaseCosts(phaseId),
    enabled: !!phaseId,
  });
};

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

    const { data: phaseData } = await supabase
      .from('project_phases')
      .select('project_id')
      .eq('id', dto.phase_id)
      .single();

    if (phaseData) {
      const { data: currentProject } = await supabase
        .from('projects')
        .select('remaining_budget')
        .eq('id', phaseData.project_id)
        .single();

      if (currentProject) {
        await supabase
          .from('projects')
          .update({ remaining_budget: currentProject.remaining_budget - total })
          .eq('id', phaseData.project_id);
      }
    }

    return data;
  } catch (error: any) {
    if (error.code) throw error;
    throw { code: 'NETWORK', message: 'Failed to insert material cost' };
  }
};

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

    const { data: phaseData } = await supabase
      .from('project_phases')
      .select('project_id')
      .eq('id', dto.phase_id)
      .single();

    if (phaseData) {
      const { data: currentProject } = await supabase
        .from('projects')
        .select('remaining_budget')
        .eq('id', phaseData.project_id)
        .single();

      if (currentProject) {
        await supabase
          .from('projects')
          .update({ remaining_budget: currentProject.remaining_budget - total })
          .eq('id', phaseData.project_id);
      }
    }

    return data;
  } catch (error: any) {
    if (error.code) throw error;
    throw { code: 'NETWORK', message: 'Failed to insert labour cost' };
  }
};

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