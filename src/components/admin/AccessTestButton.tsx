import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AccessTestButtonProps {
  userId: string;
  userName: string;
}

export const AccessTestButton = ({ userId, userName }: AccessTestButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: accessPreview, isLoading } = useQuery({
    queryKey: ['access-preview', userId],
    queryFn: async () => {
      // Get user's accessible projects
      const { data: projectRoles } = await supabase
        .from('user_project_role')
        .select(`
          role,
          project:projects(id, name)
        `)
        .eq('user_id', userId);

      // Get user's accessible phases
      const { data: phaseRoles } = await supabase
        .from('user_phase_role')
        .select(`
          role,
          phase:project_phases(id, name, project_id)
        `)
        .eq('user_id', userId);

      return {
        projects: projectRoles || [],
        phases: phaseRoles || []
      };
    },
    enabled: isOpen && !!userId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          Test Access
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Access Preview for {userName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Project Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {accessPreview?.projects.length ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    Project Access ({accessPreview?.projects.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accessPreview?.projects.length ? (
                    <div className="space-y-2">
                      {accessPreview.projects.map((projectRole: any) => (
                        <div key={`${projectRole.project.id}-${projectRole.role}`} 
                             className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium">{projectRole.project.name}</span>
                          <Badge variant={projectRole.role === 'manager' ? 'default' : 'secondary'}>
                            {projectRole.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No project access assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Phase Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {accessPreview?.phases.length ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    Phase Access ({accessPreview?.phases.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accessPreview?.phases.length ? (
                    <div className="space-y-2">
                      {accessPreview.phases.map((phaseRole: any) => (
                        <div key={`${phaseRole.phase.id}-${phaseRole.role}`} 
                             className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium">{phaseRole.phase.name}</span>
                          <Badge variant={phaseRole.role === 'manager' ? 'default' : 'secondary'}>
                            {phaseRole.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No phase access assigned</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};