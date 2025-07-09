import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const fetchPhaseChecks = (phaseId: string) => 
  useOfflineQuery(
    ['phaseChecks', phaseId],
    async () => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('id', phaseId);
      
      if (error) throw error;
      return data;
    }
  );

export const mutatePhaseCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('project_phases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['phaseChecks'] });
      
      const previousData = queryClient.getQueryData(['phaseChecks']);
      
      queryClient.setQueryData(['phaseChecks'], (old: any) => {
        if (!old) return old;
        return old.map((item: any) => 
          item.id === id ? { ...item, ...updates } : item
        );
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['phaseChecks'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseChecks'] });
      
      // Send sync push
      if (typeof window !== 'undefined' && 'sendPush' in window) {
        (window as any).sendPush('data-sync', { table: 'project_phases' });
      }
    },
  });
};