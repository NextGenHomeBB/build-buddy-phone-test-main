import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, MapPin, Users, Plus, Search, Filter, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog';
import { QuickAssignDrawer } from '@/components/QuickAssignDrawer';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAccessibleProjects, useDeleteProject } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
export default function Projects() {
  const {
    data: projects,
    isLoading,
    error
  } = useAccessibleProjects();
  const {
    canCreateProject
  } = useRoleAccess();
  const deleteProject = useDeleteProject();
  const {
    toast
  } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`)) {
      try {
        await deleteProject.mutateAsync(projectId);
        toast({
          title: "Project deleted",
          description: `"${projectName}" has been successfully deleted.`
        });
      } catch (error) {
        console.error('Error deleting project:', error);
        toast({
          title: "Delete failed",
          description: "Failed to delete the project. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'planning':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Filter projects based on search and filters
  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || project.location.toLowerCase().includes(searchTerm.toLowerCase()) || project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];
  if (error) {
    console.error('Projects error:', error);
    return <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-destructive">Error loading projects</h3>
            <p className="text-muted-foreground">Please try refreshing the page</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </AppLayout>;
  }
  return <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your construction projects
            </p>
          </div>
          
          {canCreateProject() && <CreateProjectDialog>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </CreateProjectDialog>}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search projects..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="renovation">Renovation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>)}
          </div>}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {projects?.length === 0 ? 'No projects yet' : 'No matching projects'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {projects?.length === 0 ? 'Create your first project to get started with project management.' : 'Try adjusting your search criteria to find what you\'re looking for.'}
              </p>
              {projects?.length === 0 && canCreateProject() && <CreateProjectDialog>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Project
                  </Button>
                </CreateProjectDialog>}
            </CardContent>
          </Card>}

        {/* Projects Grid */}
        {!isLoading && filteredProjects.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {canCreateProject() && <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={e => {
                  e.preventDefault();
                  handleDeleteProject(project.id, project.name);
                }} title={`Delete ${project.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Start Date</span>
                      </div>
                      <p className="font-medium my-[50px]">
                        {format(new Date(project.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span>Budget</span>
                      </div>
                      <p className="font-medium">
                        ${project.budget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/projects/${project.id}`}>
                      View Project
                    </Link>
                  </Button>
                </CardContent>
              </Card>)}
          </div>}

        {/* Results summary */}
        {!isLoading && filteredProjects.length > 0 && <div className="text-center text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {projects?.length || 0} projects
          </div>}

      </div>
    </AppLayout>;
}