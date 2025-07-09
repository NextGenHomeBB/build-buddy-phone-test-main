import { supabase } from "@/integrations/supabase/client";
import { useOfflineQuery } from "@/hooks/useOfflineQuery";

export function fetchProjectTeam(projectId: string) {
  return useOfflineQuery(
    ['projectTeam', projectId],
    async () => {
      const { data, error } = await supabase
        .from('user_project_role')
        .select('role, users ( id, full_name, avatar_url, phone )')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    }
  );
}