import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProject, useProjectPhases } from '@/hooks/useProjects';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Clock,
  FileText,
  Package,
  Users,
  Activity,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Pause,
  ChevronDown,
  Sprout,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { EditProjectDialog } from '@/components/project/EditProjectDialog';
import { ProjectManagerSelector } from '@/components/project/ProjectManagerSelector';
import { ProjectOverview } from '@/components/project/ProjectOverview';
import { ProjectTeamTab } from './ProjectTeamTab';
import { CreatePhaseDialog } from '@/components/project/CreatePhaseDialog';
import { EditPhaseDialog } from '@/components/project/EditPhaseDialog';
import { PhaseCalendar } from '@/components/PhaseCalendar';
import { ProjectMaterials } from '@/components/project/ProjectMaterials';
import { ProjectChecklistsTab } from '@/components/project/ProjectChecklistsTab';
import { ProjectDocuments } from '@/components/project/ProjectDocuments';
import { getPriorityIcon, getStatusColor, getPhaseStatusIcon } from '@/lib/ui-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectSeeding } from '@/hooks/useProjectSeeding';

// Force rebuild after revert to fix dynamic import issue
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(id!);
  const { data: phases, isLoading: phasesLoading } = useProjectPhases(id!);
  const { canEditProject, canAddPhase, canEditPhase, canViewReports } = useRoleAccess();
  const { toast } = useToast();
  const seedPhases = useProjectSeeding(id!);

  // Get current tab from URL or default to overview
  const currentTab = searchParams.get('tab') || 'overview';
  const validTabs = ['overview', 'phases', 'calendar', 'checklists', 'materials', 'labour', 'team', 'docs', 'activity'];
  const activeTab = validTabs.includes(currentTab) ? currentTab : 'overview';

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value === 'overview') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', value);
    }
    setSearchParams(newSearchParams);
  };

  if (projectLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">Project not found</h2>
            <Button asChild className="mt-4">
              <Link to="/projects">Back to Projects</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'on-hold': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const updateProjectStatus = async (newStatus: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled') => {
    if (!canEditProject()) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to update project status.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      await refetchProject();
      toast({
        title: "Status updated",
        description: `Project status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  const updateProjectType = async (newType: 'residential' | 'commercial' | 'infrastructure' | 'renovation') => {
    if (!canEditProject()) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to update project type.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ type: newType })
        .eq('id', id);

      if (error) throw error;

      await refetchProject();
      toast({
        title: "Type updated",
        description: `Project type changed to ${newType}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project type",
        variant: "destructive",
      });
    }
  };


  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>

        {/* Project Overview */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {project.name}
                </h1>
                {canEditProject() ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={`${getStatusColor(project.status)} cursor-pointer`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => updateProjectStatus('planning')}>
                        Planning
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProjectStatus('active')}>
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProjectStatus('on-hold')}>
                        On Hold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProjectStatus('completed')}>
                        Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProjectStatus('cancelled')}>
                        Cancelled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                )}
                {canEditProject() ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => updateProjectType('residential')}>
                        Residential
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProjectType('commercial')}>
                        Commercial
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProjectType('infrastructure')}>
                        Infrastructure
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProjectType('renovation')}>
                        Renovation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge variant="outline">
                    {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {project.description}
              </p>
            </div>
            
            <div className="flex gap-2">
              {canEditProject() && (
                <EditProjectDialog project={project}>
                  <Button variant="outline" size="sm">
                    Edit Project
                  </Button>
                </EditProjectDialog>
              )}
              {canViewReports() && (
                <Button size="sm" asChild>
                  <Link to={`/projects/${id}/reports`}>
                    View Reports
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <div className="text-lg font-semibold">{project.progress}%</div>
                  </div>
                </div>
                <Progress value={project.progress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Budget</div>
                    <div className="text-lg font-semibold">
                      ${(project.spent / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
                <Progress value={(project.spent / project.budget) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Calendar className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Timeline</div>
                    <div className="text-sm font-medium">
                      {format(new Date(project.start_date), 'MMM dd')} - {format(new Date(project.end_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <MapPin className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="text-sm font-medium">{project.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-9 sm:grid-cols-9">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="phases" className="text-xs sm:text-sm">Phases</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">Calendar</TabsTrigger>
            <TabsTrigger value="checklists" className="text-xs sm:text-sm">Checklists</TabsTrigger>
            <TabsTrigger value="materials" className="text-xs sm:text-sm">Materials</TabsTrigger>
            <TabsTrigger value="labour" className="text-xs sm:text-sm">Labour</TabsTrigger>
            <TabsTrigger value="team" className="text-xs sm:text-sm">Team</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs sm:text-sm">Docs</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ProjectOverview project={project} phases={phases} />
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Project Phases</h3>
              <div className="flex items-center gap-2">
                {!phasesLoading && phases?.length === 0 && canAddPhase() && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => seedPhases.mutate()}
                    disabled={seedPhases.isPending}
                    className="gap-2"
                  >
                    {seedPhases.isPending ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    ) : (
                      <Sprout className="h-3 w-3" />
                    )}
                    {seedPhases.isPending ? 'Creating...' : 'Create Default Phases'}
                  </Button>
                )}
                {canAddPhase() && (
                  <CreatePhaseDialog projectId={id!}>
                    <Button size="sm">
                      Add Phase
                    </Button>
                  </CreatePhaseDialog>
                )}
              </div>
            </div>
            
            {phasesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {phases && phases.length > 0 ? (
                phases.map((phase) => (
                    <Card 
                      key={phase.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/projects/${id}/phase/${phase.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const Icon = getPhaseStatusIcon(phase.status);
                                return <Icon className="h-4 w-4" />;
                              })()}
                              <h4 className="font-semibold">{phase.name}</h4>
                              <Badge variant="outline" className={getStatusColor(phase.status)}>
                                {phase.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {phase.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {phase.start_date && phase.end_date ? `${format(new Date(phase.start_date), 'MMM dd')} - ${format(new Date(phase.end_date), 'MMM dd')}` : 'No dates'}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${((phase.material_cost || 0) + (phase.labour_cost || 0)).toLocaleString()} / ${phase.budget.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                0 / 0 tasks
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right space-y-1">
                              <div className="text-sm font-medium">{phase.progress}%</div>
                              <Progress value={phase.progress} className="w-20" />
                            </div>
                            {canEditPhase() && (
                              <EditPhaseDialog phase={phase} projectId={id!}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </EditPhaseDialog>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Sprout className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium">No phases found</h4>
                          <p className="text-sm text-muted-foreground">
                            This project doesn't have any phases yet. Create the default construction phases to get started.
                          </p>
                        </div>
                        {canAddPhase() && (
                          <Button 
                            onClick={() => seedPhases.mutate()}
                            disabled={seedPhases.isPending}
                            className="gap-2"
                          >
                            {seedPhases.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            ) : (
                              <Sprout className="h-4 w-4" />
                            )}
                            {seedPhases.isPending ? 'Creating phases...' : 'Create Default Phases'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <PhaseCalendar projectId={id!} />
          </TabsContent>

          <TabsContent value="checklists">
            <ProjectChecklistsTab projectId={id!} />
          </TabsContent>

          <TabsContent value="team">
            <ProjectTeamTab projectId={id!} />
          </TabsContent>

          {/* Other tabs with placeholder content */}
          <TabsContent value="materials">
            <ProjectMaterials projectId={id!} />
          </TabsContent>

          <TabsContent value="labour">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Labour & Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Labour tracking coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <ProjectDocuments projectId={id!} />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Activity feed coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
