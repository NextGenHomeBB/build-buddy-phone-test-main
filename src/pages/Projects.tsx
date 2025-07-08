import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, MapPin, Users, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog';
import { useRoleAccess } from '@/hooks/useRoleAccess';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { canCreateProject } = useRoleAccess();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'on-hold': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              {canCreateProject() ? 'Manage all your construction projects' : 'View your assigned projects'}
            </p>
          </div>
          {canCreateProject() && (
            <CreateProjectDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </CreateProjectDialog>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {project.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{project.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(project.start_date), 'MMM dd')} - {format(new Date(project.end_date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>${(project.spent / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{project.manager?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/projects/${project.id}`}>
                      View Project
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )) || (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No projects found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {canCreateProject() ? 'Get started by creating your first project.' : 'No projects have been assigned to you yet.'}
                </p>
                {canCreateProject() && (
                  <CreateProjectDialog>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </CreateProjectDialog>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}