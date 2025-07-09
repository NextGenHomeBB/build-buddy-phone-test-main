import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Types
type UserRole = 'admin' | 'manager' | 'worker' | 'guest';

interface ProjectRole {
  id: string;
  user_id: string;
  project_id: string;
  role: 'manager' | 'worker';
  created_at: string;
  updated_at: string;
}

interface PhaseRole {
  id: string;
  user_id: string;
  phase_id: string;
  role: 'manager' | 'worker';
  created_at: string;
  updated_at: string;
}

interface AccessResult {
  canView: boolean;
  canEdit: boolean;
  role: UserRole;
}

// Core service functions
export const accessService = {
  async getUserProjectRole(userId: string, projectId: string): Promise<ProjectRole | null> {
    const { data, error } = await supabase
      .from('user_project_role')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) throw error;
    return data as ProjectRole | null;
  },

  async getUserPhaseRole(userId: string, phaseId: string): Promise<PhaseRole | null> {
    const { data, error } = await supabase
      .from('user_phase_role')
      .select('*')
      .eq('user_id', userId)
      .eq('phase_id', phaseId)
      .maybeSingle();

    if (error) throw error;
    return data as PhaseRole | null;
  },

  async upsertUserProjectRole(userId: string, projectId: string, role: 'manager' | 'worker'): Promise<void> {
    const { error } = await supabase
      .from('user_project_role')
      .upsert({
        user_id: userId,
        project_id: projectId,
        role
      }, {
        onConflict: 'user_id,project_id'
      });

    if (error) throw error;
  },

  async removeUserProjectRole(userId: string, projectId: string, role: 'manager' | 'worker'): Promise<void> {
    const { error } = await supabase
      .from('user_project_role')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('role', role);

    if (error) throw error;
  },

  async upsertUserPhaseRole(userId: string, phaseId: string, role: 'manager' | 'worker'): Promise<void> {
    const { error } = await supabase
      .from('user_phase_role')
      .upsert({
        user_id: userId,
        phase_id: phaseId,
        role
      }, {
        onConflict: 'user_id,phase_id'
      });

    if (error) throw error;
  },

  async removeUserPhaseRole(userId: string, phaseId: string, role: 'manager' | 'worker'): Promise<void> {
    const { error } = await supabase
      .from('user_phase_role')
      .delete()
      .eq('user_id', userId)
      .eq('phase_id', phaseId)
      .eq('role', role);

    if (error) throw error;
  },

  async canEditTask(userId: string, taskId: string): Promise<boolean> {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (profile?.role === 'admin') return true;

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('project_id, phase_id, assigned_to')
      .eq('id', taskId)
      .single();
    
    if (taskError) throw taskError;
    if (!task) return false;

    // Check if user is assigned to the task
    if (task.assigned_to === userId) return true;

    // Check if user is manager of the project
    const { data: project } = await supabase
      .from('projects')
      .select('manager_id')
      .eq('id', task.project_id)
      .single();

    return project?.manager_id === userId;
  },

  async getAccess(
    userId: string, 
    options: { projectId?: string; phaseId?: string; taskId?: string }
  ): Promise<AccessResult> {
    const { projectId, phaseId, taskId } = options;

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Admin has full access
    if (profile?.role === 'admin') {
      return {
        canView: true,
        canEdit: true,
        role: 'admin'
      };
    }

    // Guest has no access
    if (!profile || !projectId) {
      return {
        canView: false,
        canEdit: false,
        role: 'guest'
      };
    }

    // Check project access
    const projectRole = await this.getUserProjectRole(userId, projectId);
    if (!projectRole) {
      return {
        canView: false,
        canEdit: false,
        role: 'guest'
      };
    }

    let effectiveRole: 'manager' | 'worker' = projectRole.role;
    
    // Check phase-specific role override
    if (phaseId) {
      const phaseRole = await this.getUserPhaseRole(userId, phaseId);
      if (phaseRole) {
        effectiveRole = phaseRole.role;
      }
    }

    // Check task-specific access
    if (taskId) {
      const canEdit = await this.canEditTask(userId, taskId);
      return {
        canView: true,
        canEdit,
        role: effectiveRole
      };
    }

    // General project/phase access
    return {
      canView: true,
      canEdit: effectiveRole === 'manager',
      role: effectiveRole
    };
  }
};

// React Query hooks
export const useUserProjectRole = (userId: string, projectId: string) => {
  return useQuery({
    queryKey: ['userProjectRole', userId, projectId],
    queryFn: () => accessService.getUserProjectRole(userId, projectId),
    enabled: !!userId && !!projectId,
  });
};

export const useUserPhaseRole = (userId: string, phaseId: string) => {
  return useQuery({
    queryKey: ['userPhaseRole', userId, phaseId],
    queryFn: () => accessService.getUserPhaseRole(userId, phaseId),
    enabled: !!userId && !!phaseId,
  });
};

export const useCanEditTask = (userId: string, taskId: string) => {
  return useQuery({
    queryKey: ['canEditTask', userId, taskId],
    queryFn: () => accessService.canEditTask(userId, taskId),
    enabled: !!userId && !!taskId,
  });
};

// Main useAccess hook
export const useAccess = ({
  projectId,
  phaseId,
  taskId,
}: {
  projectId?: string;
  phaseId?: string;
  taskId?: string;
}) => {
  const { profile } = useAuth();
  const userId = profile?.user_id;

  return useQuery({
    queryKey: ['access', userId, projectId, phaseId, taskId],
    queryFn: () => {
      if (!userId) {
        return {
          canView: false,
          canEdit: false,
          role: 'guest' as UserRole
        };
      }
      return accessService.getAccess(userId, { projectId, phaseId, taskId });
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};