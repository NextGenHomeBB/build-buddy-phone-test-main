import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: Array<'admin' | 'manager' | 'worker' | 'viewer'>;
}

/**
 * Route guard component that requires authentication
 * Optionally can require specific roles
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    // User doesn't have required role
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of RequireAuth
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  roles?: Array<'admin' | 'manager' | 'worker' | 'viewer'>
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <RequireAuth roles={roles}>
        <Component {...props} />
      </RequireAuth>
    );
  };
}