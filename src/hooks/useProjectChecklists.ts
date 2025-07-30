import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProjectChecklists(projectId: string) {
  return useQuery({
    queryKey: ['project-checklists', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Return checklists directly since project_checklists table doesn't exist
      return data || [];
    },
    enabled: !!projectId,
  });
}