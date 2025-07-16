import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess } from '@/services/access.service';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAccessProps {
  children: ReactNode;
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  rolesAllowed?: ('admin' | 'manager' | 'worker')[];
}

export const RequireAccess = ({
  children,
  projectId,
  phaseId,
  taskId,
  rolesAllowed,
}: RequireAccessProps) => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { data: access, isLoading, error } = useAccess({
    projectId,
    phaseId,
    taskId,
  });

  const isStillLoading = authLoading || isLoading;

  useEffect(() => {
    if (isStillLoading) return;

    // If there's an error or no access data, deny access
    if (error || !access) {
      navigate('/403');
      return;
    }

    // Check if user can view
    if (!access.canView) {
      navigate('/403');
      return;
    }

    // Check if user's role is in allowed roles
    if (rolesAllowed && access.role !== 'admin' && !rolesAllowed.includes(access.role as 'admin' | 'manager' | 'worker')) {
      navigate('/403');
      return;
    }
  }, [access, isStillLoading, error, navigate, rolesAllowed]);

  // Show loading or nothing while checking access
  if (isStillLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error if access check failed
  if (error) {
    console.error('Access check error:', error);
    return (
      <div className="p-4 text-center text-destructive">
        Access check failed: {error.message}
      </div>
    );
  }

  // Show message if no access data
  if (!access) {
    console.warn('No access data returned');
    return (
      <div className="p-4 text-center text-muted-foreground">
        Access denied: No permission data
      </div>
    );
  }

  // If we get here, access is granted
  return <>{children}</>;
};