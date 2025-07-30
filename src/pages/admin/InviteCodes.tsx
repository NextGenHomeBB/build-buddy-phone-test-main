import { AppLayout } from '@/components/layout/AppLayout';
import { InviteCodesManager } from '@/components/admin/InviteCodesManager';
import { RequireRole } from '@/components/auth/RequireRole';

export default function InviteCodes() {
  return (
    <RequireRole allowedRoles={['admin']}>
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Invite Codes</h1>
            <p className="text-muted-foreground">
              Generate and manage invite codes for your organization
            </p>
          </div>
          
          <InviteCodesManager />
        </div>
      </AppLayout>
    </RequireRole>
  );
}