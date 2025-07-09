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
      // Mock data for now - replace with actual Supabase queries
      const mockData: AdminStats = {
        totalProjects: 24,
        activePhases: 18,
        totalBudget: 2450000,
        spentBudget: 1680000,
        budgetUtilization: 68.6,
        monthlyBudget: [
          { month: 'Aug', budget: 420000, spent: 385000 },
          { month: 'Sep', budget: 380000, spent: 362000 },
          { month: 'Oct', budget: 450000, spent: 431000 },
          { month: 'Nov', budget: 520000, spent: 498000 },
          { month: 'Dec', budget: 380000, spent: 285000 },
          { month: 'Jan', budget: 620000, spent: 419000 },
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return mockData;

      // Real implementation would be:
      // const { data: projects } = await supabase
      //   .from('projects')
      //   .select('*');
      
      // const { data: phases } = await supabase
      //   .from('project_phases')
      //   .select('*')
      //   .eq('status', 'active');
      
      // // Calculate stats from real data
      // return calculatedStats;
    }
  );
}