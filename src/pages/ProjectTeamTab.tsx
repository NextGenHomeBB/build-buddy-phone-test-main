import React, { useState } from 'react';
import { Plus, Phone, MessageCircle } from 'lucide-react';
import { fetchProjectTeam } from '@/services/projectTeam.service';
import { RequireAccess } from '@/components/auth/RequireAccess';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { accessService } from '@/services/access.service';

interface ProjectTeamTabProps {
  projectId: string;
}

interface TeamMember {
  role: string;
  user_id: string;
  profile: {
    user_id: string;
    name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

export function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('worker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { data: teamData, isLoading } = fetchProjectTeam(projectId);

  const handleCall = (member: TeamMember) => {
    if (member.profile?.phone) {
      window.open(`tel:${member.profile.phone}`);
    } else {
      toast({
        title: "No phone number",
        description: "This team member hasn't provided a phone number.",
        variant: "destructive"
      });
    }
  };

  const handleMessage = (member: TeamMember) => {
    if (member.profile?.phone) {
      window.open(`sms:${member.profile.phone}`);
    } else {
      toast({
        title: "No phone number",
        description: "This team member hasn't provided a phone number.",
        variant: "destructive"
      });
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmitting(true);
    try {
      // For now, we'll use the upsert function from accessService
      // In a real app, you'd first need to find the user by email
      // This is a simplified implementation
      toast({
        title: "Feature not implemented",
        description: "User invitation requires additional user lookup functionality.",
        variant: "destructive"
      });
      setShowInviteSheet(false);
      setInviteEmail('');
      setInviteRole('worker');
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'worker':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Sort team members: managers first, then workers
  const sortedTeamMembers = teamData ? [...teamData].sort((a, b) => {
    if (a.role === 'manager' && b.role !== 'manager') return -1;
    if (a.role !== 'manager' && b.role === 'manager') return 1;
    return 0;
  }) : [];

  const renderTeamMember = (member: TeamMember, index: number) => {
    if (!member.profile) return null;

    return (
      <Card key={`${member.user_id}-${index}`} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.profile.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(member.profile.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-medium text-sm">{member.profile.name}</h3>
                <Badge 
                  variant="secondary" 
                  className={`text-xs mt-1 ${getRoleColor(member.role)}`}
                >
                  {member.role}
                </Badge>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCall(member)}
                className="h-8 w-8 p-0"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMessage(member)}
                className="h-8 w-8 p-0"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <RequireAccess projectId={projectId}>
        <div className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </RequireAccess>
    );
  }

  return (
    <RequireAccess projectId={projectId}>
      <div className="relative p-6 pb-20">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Team Members</h2>
          
          {sortedTeamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No team members found for this project.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTeamMembers.map((member, index) => renderTeamMember(member, index))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <Button
          onClick={() => setShowInviteSheet(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="lg"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Invite Bottom Sheet */}
        <BottomSheet open={showInviteSheet} onOpenChange={setShowInviteSheet}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteSheet(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || !inviteEmail.trim()}
                >
                  {isSubmitting ? 'Inviting...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </BottomSheet>
      </div>
    </RequireAccess>
  );
}

export default ProjectTeamTab;