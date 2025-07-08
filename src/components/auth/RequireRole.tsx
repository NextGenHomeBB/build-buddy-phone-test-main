import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'manager' | 'worker' | 'viewer'>;
  fallbackPath?: string;
}

export function RequireRole({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}: RequireRoleProps) {
  const { profile } = useRoleAccess();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}