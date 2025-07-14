import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProjectChecklists(projectId: string) {
  return useQuery({
    queryKey: ['project-checklists', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_checklists')
        .select(`
          *,
          checklist:checklists(*)
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      // Transform the data to include project_id in checklist items
      return (data || []).map(projectChecklist => ({
        ...projectChecklist.checklist,
        project_id: projectId,
        items: projectChecklist.checklist?.items || []
      }));
    },
    enabled: !!projectId,
  });
}