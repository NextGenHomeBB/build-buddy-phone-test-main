import { useAuth } from '@/contexts/AuthContext';

export const useRoleAccess = () => {
  const { profile } = useAuth();
  
  const isAdmin = () => profile?.role === 'admin';
  const isManager = () => profile?.role === 'manager';
  const isWorker = () => profile?.role === 'worker';
  const isViewer = () => profile?.role === 'viewer';
  
  const canCreateProject = () => isAdmin() || isManager();
  const canEditProject = () => isAdmin() || isManager();
  const canDeleteProject = () => isAdmin();
  const canManageUsers = () => isAdmin();
  const canAddPhase = () => isAdmin() || isManager();
  const canEditPhase = () => isAdmin() || isManager();
  const canManageMaterials = () => isAdmin() || isManager();
  const canViewReports = () => isAdmin() || isManager();
  const canViewAllTasks = () => isAdmin() || isManager();
  const canCreateTask = () => isAdmin() || isManager();
  const canUpdateTaskStatus = () => true; // All authenticated users can update status of their tasks
  const canViewTimeSheets = () => isAdmin() || isManager();
  const canViewSettings = () => isAdmin() || isManager();
  
  const hasAdminAccess = () => isAdmin() || isManager();
  const hasFullAccess = () => isAdmin();
  
  return {
    profile,
    role: profile?.role,
    isAdmin,
    isManager,
    isWorker,
    isViewer,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canManageUsers,
    canAddPhase,
    canEditPhase,
    canManageMaterials,
    canViewReports,
    canViewAllTasks,
    canCreateTask,
    canUpdateTaskStatus,
    canViewTimeSheets,
    canViewSettings,
    hasAdminAccess,
    hasFullAccess,
  };
};