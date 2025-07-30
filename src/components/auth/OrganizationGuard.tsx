import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && profile) {
      // Check if user needs to join an organization
      const needsOrganization = !profile.organization_id || profile.organization_id === '00000000-0000-0000-0000-000000000000';
      
      // Don't redirect if already on join-organization page
      if (needsOrganization && location.pathname !== '/join-organization') {
        navigate('/join-organization', { replace: true });
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  // Show loading while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user needs organization and not on join page, don't render children
  const needsOrganization = profile && (!profile.organization_id || profile.organization_id === '00000000-0000-0000-0000-000000000000');
  if (needsOrganization && location.pathname !== '/join-organization') {
    return null;
  }

  return <>{children}</>;
}