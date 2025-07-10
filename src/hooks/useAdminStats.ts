import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalProjects: number;
  activePhases: number;
  totalBudget: number;
  spentBudget: number;
  budgetUtilization: number;
  monthlyBudget: Array<{
    month: string;
    budget: number;
    spent: number;
  }>;
}

export function useAdminStats() {
  return useOfflineQuery(
    ['adminStats'],
    async (): Promise<AdminStats> => {
      // Fetch real data from Supabase
      const [
        { data: projects, error: projectsError },
        { data: phases, error: phasesError },
        { data: tasks, error: tasksError },
        { data: profiles, error: profilesError }
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('project_phases').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('profiles').select('*')
      ]);

      if (projectsError || phasesError || tasksError || profilesError) {
        throw new Error('Failed to fetch stats data');
      }

      // Calculate real stats
      const totalProjects = projects?.length || 0;
      const activePhases = phases?.filter(phase => phase.status === 'active').length || 0;
      const totalBudget = projects?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0;
      const spentBudget = projects?.reduce((sum, project) => sum + (project.spent || 0), 0) || 0;
      const budgetUtilization = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

      // Mock monthly budget data for now (would need time-based queries)
      const monthlyBudget = [
        { month: 'Aug', budget: 420000, spent: 385000 },
        { month: 'Sep', budget: 380000, spent: 362000 },
        { month: 'Oct', budget: 450000, spent: 431000 },
        { month: 'Nov', budget: 520000, spent: 498000 },
        { month: 'Dec', budget: 380000, spent: 285000 },
        { month: 'Jan', budget: 620000, spent: 419000 },
      ];

      return {
        totalProjects,
        activePhases,
        totalBudget,
        spentBudget,
        budgetUtilization,
        monthlyBudget
      };
    }
  );
}