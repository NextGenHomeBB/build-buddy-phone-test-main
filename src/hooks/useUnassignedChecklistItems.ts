import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnassignedChecklistItem {
  id: string;
  title: string;
  description?: string;
  project: { name: string } | null;
  checklist: { name: string } | null;
  priority?: string;
  projectChecklistId: string;
}

export function useUnassignedChecklistItems(projectId?: string) {
  return useQuery({
    queryKey: ['unassigned-checklist-items', projectId],
    queryFn: async () => {
      console.log('🔍 Fetching unassigned checklist items for project:', projectId);
      
      // Since project_checklists table doesn't exist, return empty array
      return [];
    },
  });
}