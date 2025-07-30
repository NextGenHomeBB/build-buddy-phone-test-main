import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Phone, MessageCircle, Users, Crown, User, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['manager', 'worker', 'viewer'], {
    required_error: 'Please select a role',
  }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  role: 'admin' | 'manager' | 'worker' | 'viewer';
  avatar_url?: string;
  phone?: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
    case 'manager':
      return <Crown className="h-3 w-3" />;
    case 'worker':
      return <User className="h-3 w-3" />;
    case 'viewer':
      return <Eye className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-destructive text-destructive-foreground';
    case 'manager':
      return 'bg-primary text-primary-foreground';
    case 'worker':
      return 'bg-success text-success-foreground';
    case 'viewer':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const roleOrder = { admin: 0, manager: 1, worker: 2, viewer: 3 };

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'worker',
    },
  });

  // Fetch team members for the project
  const { data: teamMembers, isLoading } = useOfflineQuery(
    ['team-members', id],
    async (): Promise<TeamMember[]> => {
      if (!id) return [];

      // Get project managers from user_project_role
      const { data: projectTeam } = await supabase
        .from('user_project_role')
        .select(`
          role,
          user_id,
          profiles!user_project_role_user_id_fkey(id, name, role, avatar_url, phone)
        `)
        .eq('project_id', id);

      // Combine and deduplicate members
      const members: TeamMember[] = [];
      const seenIds = new Set<string>();

      // Add project team members
      projectTeam?.forEach((member) => {
        if (member.profiles && !seenIds.has(member.profiles.id)) {
          members.push({
            id: member.profiles.id,
            user_id: member.profiles.id,
            name: member.profiles.name || 'Unknown',
            role: member.profiles.role as 'admin' | 'manager' | 'worker' | 'viewer',
            avatar_url: member.profiles.avatar_url,
            phone: member.profiles.phone,
          });
          seenIds.add(member.profiles.id);
        }
      });

      // Sort by role priority
      return members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
    }
  );

  const onInvite = async (data: InviteFormData) => {
    setIsSubmitting(true);
    try {
      // Get current user's organization for the invitation
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Not authenticated');
      }

      // Call the send-invite edge function
      const { data: inviteResult, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: data.email,
          role: data.role,
          message: `You've been invited to join our team as a ${data.role}. Welcome aboard!`,
          organization_id: session.session.user.user_metadata?.organization_id
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send invitation');
      }

      toast({
        title: 'Invite sent 🎉',
        description: `Invitation sent to ${data.email} as ${data.role}`,
      });

      form.reset();
      setIsInviteOpen(false);
    } catch (error: any) {
      console.error('Invitation error:', error);
      toast({
        title: t('Error'),
        description: error.message || t('Failed to send invitation'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCall = (member: TeamMember) => {
    if (member.phone) {
      window.open(`tel:${member.phone}`, '_self');
    } else {
      toast({
        title: t('No phone number'),
        description: t('This member has not provided a phone number'),
        variant: 'destructive',
      });
    }
  };

  const handleMessage = (member: TeamMember) => {
    if (member.phone) {
      window.open(`sms:${member.phone}`, '_self');
    } else {
      toast({
        title: t('No phone number'),
        description: t('This member has not provided a phone number'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('Team')}</h1>
            <p className="text-muted-foreground">
              {t('Manage project team members and roles')}
            </p>
          </div>
          <Button onClick={() => setIsInviteOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('Invite')}
          </Button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{teamMembers?.length || 0}</div>
              <div className="text-sm text-muted-foreground">{t('Total Members')}</div>
            </CardContent>
          </Card>
          
          {(['manager', 'worker', 'viewer'] as const).map((role) => {
            const count = teamMembers?.filter((m) => m.role === role).length || 0;
            return (
              <Card key={role}>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getRoleIcon(role)}
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {t(role + 's')}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('Team Members')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {teamMembers && teamMembers.length > 0 ? (
              <div className="space-y-0">
                {teamMembers.map((member, index) => (
                  <div key={member.id}>
                    <div className="flex items-center gap-4 p-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={member.avatar_url} 
                          alt={member.name}
                        />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">
                            {member.name}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`${getRoleColor(member.role)} text-xs`}
                          >
                            <span className="mr-1">{getRoleIcon(member.role)}</span>
                            {t(member.role)}
                          </Badge>
                        </div>
                        {member.phone && (
                          <p className="text-sm text-muted-foreground">
                            {member.phone}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(member)}
                          className="p-2"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMessage(member)}
                          className="p-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {index < teamMembers.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>{t('No team members found')}</p>
                <p className="text-sm">{t('Invite members to get started')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Member Bottom Sheet */}
        <BottomSheet open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <Card className="border-0">
            <CardHeader>
              <CardTitle>{t('Invite Team Member')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Email Address')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('Enter email address')}
                            className="min-h-[44px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Role')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-h-[44px]">
                              <SelectValue placeholder={t('Select a role')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manager">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                {t('Manager')}
                              </div>
                            </SelectItem>
                            <SelectItem value="worker">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {t('Worker')}
                              </div>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                {t('Viewer')}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteOpen(false)}
                      className="flex-1 min-h-[44px]"
                      disabled={isSubmitting}
                    >
                      {t('Cancel')}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 min-h-[44px]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          {t('Sending...')}
                        </>
                      ) : (
                        t('Send Invite')
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </BottomSheet>
      </div>
    </AppLayout>
  );
}