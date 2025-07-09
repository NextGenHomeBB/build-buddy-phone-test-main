import { supabase } from "@/integrations/supabase/client";
import { useOfflineQuery } from "@/hooks/useOfflineQuery";

export function fetchProjectTeam(projectId: string) {
  return useOfflineQuery(
    ['projectTeam', projectId],
    async () => {
      const { data, error } = await supabase
        .from('user_project_role')
        .select(`
          role,
          user_id
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      // Fetch user profiles separately
      if (!data || data.length === 0) return [];
      
      const userIds = data.map(item => item.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, phone')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Combine the data
      return data.map(roleItem => ({
        role: roleItem.role,
        user_id: roleItem.user_id,
        profile: profiles?.find(p => p.user_id === roleItem.user_id) || null
      }));
    }
  );
}