import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useNavigationCounts() {
  const { user } = useAuth();

  // Get total projects count
  const { data: projectsCount = 0 } = useQuery({
    queryKey: ['projects-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Get user's pending tasks count
  const { data: myTasksCount = 0 } = useQuery({
    queryKey: ['my-tasks-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['todo', 'in-progress']);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Get total users count (for admin)
  const { data: usersCount = 0 } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_placeholder', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Get pending feedback count (for admin)
  const { data: pendingFeedbackCount = 0 } = useQuery({
    queryKey: ['pending-feedback-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  return {
    projectsCount,
    myTasksCount,
    usersCount,
    pendingFeedbackCount,
  };
}