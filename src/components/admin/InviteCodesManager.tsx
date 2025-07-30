import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { inviteCodesService, InviteCode } from '@/services/inviteCodesService';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Plus, X, QrCode, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export function InviteCodesManager() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [maxUses, setMaxUses] = useState<string>('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const { toast } = useToast();

  const loadCodes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const organizationCodes = await inviteCodesService.getOrganizationCodes(profile.organization_id);
      setCodes(organizationCodes);
    } catch (error) {
      console.error('Failed to load invite codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invite codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      
      const options: { expires_at?: string; max_uses?: number } = {};
      
      if (maxUses && parseInt(maxUses) > 0) {
        options.max_uses = parseInt(maxUses);
      }
      
      if (hasExpiry && expiryDate) {
        options.expires_at = new Date(expiryDate).toISOString();
      }

      await inviteCodesService.generateCode(options);
      
      toast({
        title: 'Success',
        description: 'Invite code generated successfully',
      });
      
      setIsCreateOpen(false);
      setMaxUses('');
      setExpiryDate('');
      setHasExpiry(false);
      loadCodes();
    } catch (error) {
      console.error('Failed to generate code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invite code',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: 'Invite code copied to clipboard',
    });
  };

  const deactivateCode = async (codeId: string) => {
    try {
      await inviteCodesService.deactivateCode(codeId);
      toast({
        title: 'Success',
        description: 'Invite code deactivated',
      });
      loadCodes();
    } catch (error) {
      console.error('Failed to deactivate code:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate invite code',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Invite Codes</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Organization Invite Codes</CardTitle>
          <CardDescription>
            Generate and manage invite codes for your organization
          </CardDescription>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invite Code</DialogTitle>
              <DialogDescription>
                Create a new invite code for your organization
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="maxUses">Maximum Uses (optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasExpiry"
                  checked={hasExpiry}
                  onCheckedChange={setHasExpiry}
                />
                <Label htmlFor="hasExpiry">Set expiration date</Label>
              </div>
              
              {hasExpiry && (
                <div>
                  <Label htmlFor="expiryDate">Expiration Date</Label>
                  <Input
                    id="expiryDate"
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateCode} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Code'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {codes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invite codes generated yet
          </div>
        ) : (
          <div className="space-y-4">
            {codes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-lg font-mono font-bold">{code.code}</code>
                    <Badge variant={code.is_active ? 'default' : 'secondary'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {code.current_uses}
                      {code.max_uses ? `/${code.max_uses}` : ''} uses
                    </div>
                    
                    {code.expires_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires {format(new Date(code.expires_at), 'MMM d, yyyy')}
                      </div>
                    )}
                    
                    <div>
                      Created {format(new Date(code.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  {code.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deactivateCode(code.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}