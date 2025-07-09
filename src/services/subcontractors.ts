import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const fetchSubcontractor = (id: string) => 
  useOfflineQuery(
    ['subcontractors', id],
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'worker')
        .single();
      
      if (error) throw error;
      return data;
    }
  );

export const mutateSubcontractor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['subcontractors'] });
      
      const previousData = queryClient.getQueryData(['subcontractors', id]);
      
      queryClient.setQueryData(['subcontractors', id], (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      const { id } = variables;
      if (context?.previousData) {
        queryClient.setQueryData(['subcontractors', id], context.previousData);
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors', id] });
      
      // Send sync push
      if (typeof window !== 'undefined' && 'sendPush' in window) {
        (window as any).sendPush('data-sync', { table: 'profiles' });
      }
    },
  });
};