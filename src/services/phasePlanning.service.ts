import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UpdatePhaseDatesParams {
  phaseId: string;
  startDate: string;
  endDate: string;
  projectId: string;
}

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