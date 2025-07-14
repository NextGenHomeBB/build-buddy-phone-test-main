import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess } from '@/services/access.service';

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
  const { data: access, isLoading, error } = useAccess({
    projectId,
    phaseId,
    taskId,
  });

  useEffect(() => {
    if (isLoading) return;

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
  }, [access, isLoading, error, navigate, rolesAllowed]);

  // Show loading or nothing while checking access
  if (isLoading || !access) {
    return null;
  }

  // If we get here, access is granted
  return <>{children}</>;
};