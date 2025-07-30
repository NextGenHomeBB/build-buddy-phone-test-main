import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface JoinOrganizationProps {
  onSuccess?: () => void;
}

export default function JoinOrganization({ onSuccess }: JoinOrganizationProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const { toast } = useToast();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      // For now, we'll create a simple join flow
      // In a real implementation, you'd validate the invite code against a database
      
      // Simulate organization lookup
      const orgId = inviteCode.toLowerCase() === 'demo' ? '00000000-0000-0000-0000-000000000001' : null;
      
      if (!orgId) {
        toast({
          title: "Invalid invite code",
          description: "Please check your invite code and try again.",
          variant: "destructive"
        });
        return;
      }

      // Update user profile with organization
      if (user) {
        await updateProfile({
          organization_id: orgId,
          role: 'worker'
        });

        toast({
          title: "Successfully joined organization!",
          description: "Welcome to the team."
        });

        onSuccess?.();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error joining organization:', error);
      toast({
        title: "Error joining organization",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) return;

    setLoading(true);
    try {
      // Create new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName.trim()
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update user profile with new organization as admin
      if (user) {
        await updateProfile({
          organization_id: orgData.id,
          role: 'admin'
        });

        toast({
          title: "Organization created successfully!",
          description: `Welcome to ${organizationName}. You are now the admin.`
        });

        onSuccess?.();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error creating organization",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join Your Team</CardTitle>
          <CardDescription>
            Enter your invite code to join an organization or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-6">
            <Button
              type="button"
              variant={mode === 'join' ? 'default' : 'outline'}
              onClick={() => setMode('join')}
              className="flex-1"
            >
              Join Organization
            </Button>
            <Button
              type="button"
              variant={mode === 'create' ? 'default' : 'outline'}
              onClick={() => setMode('create')}
              className="flex-1"
            >
              Create Organization
            </Button>
          </div>

          {mode === 'join' ? (
            <form onSubmit={handleJoinOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Enter your invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Try "demo" for testing
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? 'Joining...' : 'Join Organization'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Enter organization name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !organizationName.trim()}
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </form>
          )}

          <div className="text-center pt-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}