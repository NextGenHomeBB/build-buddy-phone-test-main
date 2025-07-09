import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const fetchChecklists = () => 
  useOfflineQuery(
    ['checklists'],
    async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  );

export const mutateChecklist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id?: string; updates: any }) => {
      if (id) {
        const { data, error } = await supabase
          .from('checklists')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('checklists')
          .insert(updates)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['checklists'] });
      
      const previousData = queryClient.getQueryData(['checklists']);
      
      queryClient.setQueryData(['checklists'], (old: any) => {
        if (!old) return old;
        
        if (id) {
          return old.map((item: any) => 
            item.id === id ? { ...item, ...updates } : item
          );
        } else {
          return [{ ...updates, id: 'temp-' + Date.now() }, ...old];
        }
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['checklists'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      
      // Send sync push
      if (typeof window !== 'undefined' && 'sendPush' in window) {
        (window as any).sendPush('data-sync', { table: 'checklists' });
      }
    },
  });
};