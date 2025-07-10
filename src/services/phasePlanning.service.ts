import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PhaseCalendarData {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress: number;
  material_cost: number;
  labour_cost: number;
  budget: number;
  project_id: string;
}

export interface PhaseBudgetData {
  id: string;
  name: string;
  material_cost: number;
  labour_cost: number;
  budget: number;
  project_id: string;
}

export interface UpdatePhaseDatesParams {
  phaseId: string;
  startDate: string;
  endDate: string;
  projectId: string;
}

export interface UpdatePhaseBudgetParams {
  phaseId: string;
  materialCost: number;
  labourCost: number;
  projectId: string;
}

// Hook to get phases with calendar data for a project
export function usePhaseCalendar(projectId: string) {
  const { data: phases, isLoading, error, refetch } = useQuery({
    queryKey: ['phases', projectId, 'calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_phases')
        .select(`
          id, 
          name, 
          start_date, 
          end_date, 
          status, 
          progress, 
          material_cost, 
          labour_cost, 
          budget,
          project_id
        `)
        .eq('project_id', projectId)
        .order('start_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as PhaseCalendarData[];
    },
    enabled: !!projectId,
  });

  // Check for date overlaps between phases
  const checkDateOverlap = (phaseId: string, startDate: string, endDate: string) => {
    if (!phases) return false;
    
    const otherPhases = phases.filter(p => p.id !== phaseId && p.start_date && p.end_date);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    return otherPhases.some(phase => {
      const existingStart = new Date(phase.start_date!);
      const existingEnd = new Date(phase.end_date!);

      // Check if dates overlap
      return (newStart <= existingEnd && newEnd >= existingStart);
    });
  };

  return {
    phases: phases || [],
    isLoading,
    error,
    refetch,
    checkDateOverlap,
  };
}

// Hook to get budget data for a specific phase
export function usePhaseBudget(phaseId: string) {
  const { data: phase, isLoading, error, refetch } = useQuery({
    queryKey: ['phase', phaseId, 'budget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_phases')
        .select(`
          id, 
          name, 
          material_cost, 
          labour_cost, 
          budget,
          project_id
        `)
        .eq('id', phaseId)
        .single();

      if (error) throw error;
      return data as PhaseBudgetData;
    },
    enabled: !!phaseId,
  });

  return {
    phase,
    isLoading,
    error,
    refetch,
  };
}

// Hook for updating phase dates
export function usePhasePlanningMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ phaseId, startDate, endDate }: UpdatePhaseDatesParams) => {
      // Validate dates
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date cannot be later than end date');
      }

      const { data, error } = await supabase
        .from('project_phases')
        .update({
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', phaseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ phaseId, startDate, endDate, projectId }) => {
      await queryClient.cancelQueries({ queryKey: ['phases', projectId, 'calendar'] });
      
      const previousData = queryClient.getQueryData(['phases', projectId, 'calendar']);
      
      queryClient.setQueryData(['phases', projectId, 'calendar'], (old: any) => {
        if (!old) return old;
        return old.map((phase: any) => 
          phase.id === phaseId 
            ? { ...phase, start_date: startDate, end_date: endDate }
            : phase
        );
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['phases', variables.projectId, 'calendar'], context.previousData);
      }
      
      toast({
        title: "Error updating phase dates",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['phases', variables.projectId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'phases'] });
      
      toast({
        title: "Phase dates updated",
        description: "The phase timeline has been updated successfully.",
      });
    },
  });
}

// Hook for updating phase budget with project budget adjustment
export function usePhaseBudgetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ phaseId, materialCost, labourCost, projectId }: UpdatePhaseBudgetParams) => {
      // Get current phase costs to calculate delta
      const { data: currentPhase, error: currentPhaseError } = await supabase
        .from('project_phases')
        .select('material_cost, labour_cost, project_id')
        .eq('id', phaseId)
        .single();

      if (currentPhaseError) throw currentPhaseError;

      const oldTotal = (currentPhase.material_cost || 0) + (currentPhase.labour_cost || 0);
      const newTotal = materialCost + labourCost;
      const costDelta = newTotal - oldTotal;

      // Update phase costs
      const { error: phaseError } = await supabase
        .from('project_phases')
        .update({
          material_cost: materialCost,
          labour_cost: labourCost,
          budget: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', phaseId);

      if (phaseError) throw phaseError;

      // Get current project spent amount and update it
      const { data: currentProject, error: projectGetError } = await supabase
        .from('projects')
        .select('spent')
        .eq('id', projectId)
        .single();

      if (projectGetError) throw projectGetError;

      const newSpent = (currentProject.spent || 0) + costDelta;

      const { error: projectError } = await supabase
        .from('projects')
        .update({
          spent: newSpent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      return { phaseId, materialCost, labourCost, newTotal, costDelta };
    },
    onMutate: async ({ phaseId, materialCost, labourCost, projectId }) => {
      await queryClient.cancelQueries({ queryKey: ['phase', phaseId, 'budget'] });
      await queryClient.cancelQueries({ queryKey: ['phases', projectId, 'calendar'] });
      
      const previousPhaseData = queryClient.getQueryData(['phase', phaseId, 'budget']);
      const previousCalendarData = queryClient.getQueryData(['phases', projectId, 'calendar']);
      
      // Update phase budget data
      queryClient.setQueryData(['phase', phaseId, 'budget'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          material_cost: materialCost,
          labour_cost: labourCost,
          budget: materialCost + labourCost,
        };
      });

      // Update calendar data
      queryClient.setQueryData(['phases', projectId, 'calendar'], (old: any) => {
        if (!old) return old;
        return old.map((phase: any) => 
          phase.id === phaseId 
            ? { 
                ...phase, 
                material_cost: materialCost, 
                labour_cost: labourCost,
                budget: materialCost + labourCost
              }
            : phase
        );
      });

      return { previousPhaseData, previousCalendarData };
    },
    onError: (error, variables, context) => {
      if (context?.previousPhaseData) {
        queryClient.setQueryData(['phase', variables.phaseId, 'budget'], context.previousPhaseData);
      }
      if (context?.previousCalendarData) {
        queryClient.setQueryData(['phases', variables.projectId, 'calendar'], context.previousCalendarData);
      }
      
      toast({
        title: "Error updating phase budget",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['phase', variables.phaseId, 'budget'] });
      queryClient.invalidateQueries({ queryKey: ['phases', variables.projectId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'phases'] });
      
      toast({
        title: "Phase budget updated",
        description: `Budget updated to $${data.newTotal.toLocaleString()}. Project spending ${data.costDelta >= 0 ? 'increased' : 'decreased'} by $${Math.abs(data.costDelta).toLocaleString()}.`,
      });
    },
  });
}