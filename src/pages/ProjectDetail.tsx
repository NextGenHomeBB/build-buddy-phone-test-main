import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProject, useProjectPhases } from '@/hooks/useProjects';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { LabourTracking } from '@/components/project/LabourTracking';
import { getPriorityIcon, getStatusColor, getPhaseStatusIcon } from '@/lib/ui-helpers';
import { useToast } from '@/hooks/use-toast';
import { useProjectSeeding } from '@/hooks/useProjectSeeding';
import { QuickAssignDrawer } from '@/components/QuickAssignDrawer';

// Force rebuild after revert to fix dynamic import issue
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(id!);
  const { data: phases, isLoading: phasesLoading } = useProjectPhases(id!);
  const { canEditProject, canAddPhase, canEditPhase, canViewReports, canCreateProject } = useRoleAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const seedPhases = useProjectSeeding(id!);
  const isMobile = useIsMobile();

  // Mutation to update phase status
  const updatePhaseStatus = useMutation({
    mutationFn: async ({ phaseId, newStatus }: { phaseId: string; newStatus: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled' }) => {
      // Update the phase status
      const { data, error } = await supabase
        .from('project_phases')
        .update({ status: newStatus })
        .eq('id', phaseId)
        .select()
        .single();
      
      if (error) throw error;

      // If setting status to completed, automatically complete all tasks in this phase
      if (newStatus === 'completed') {
        const { error: tasksError } = await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('phase_id', phaseId)
          .neq('status', 'completed'); // Only update tasks that aren't already completed
        
        if (tasksError) {
          console.warn('Failed to auto-complete tasks:', tasksError);
          // Don't throw error, just warn - phase status update succeeded
        }

        // Skip progress update since function doesn't exist
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', id, 'phases'] });
      queryClient.invalidateQueries({ queryKey: ['phases', id, 'calendar'] });
      
      const isCompleted = data.status === 'completed';
      toast({
        title: isCompleted ? "Phase Completed! 🎉" : "Status Updated",
        description: isCompleted 
          ? `Phase "${data.name}" and all its tasks are now completed!`
          : `Phase status changed to ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update phase status. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      case 'active': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
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
        .update({ status: newStatus === 'completed' ? 'archived' : newStatus as any })
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
        .update({ description: newType }) // Use description field since type doesn't exist
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
      <div className={`space-y-4 ${isMobile ? 'pb-20' : 'space-y-6'}`}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {!isMobile && "Back to Projects"}
            </Link>
          </Button>
        </div>

        {/* Project Overview */}
        <div className={`space-y-4 ${isMobile ? 'px-4' : ''}`}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                 <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-foreground`}>
                   {project.name}
                 </h1>
                 <div className="flex items-center gap-2 flex-wrap">
                {canEditProject() ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? 'text-xs' : ''}>
                         {(project.description || 'Residential').charAt(0).toUpperCase() + (project.description || 'Residential').slice(1)}
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
                  <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>
                    {(project.description || 'Residential').charAt(0).toUpperCase() + (project.description || 'Residential').slice(1)}
                  </Badge>
                 )}
                </div>
              </div>
              <p className="text-muted-foreground">
                {project.description}
              </p>
            </div>
            
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
              {canEditProject() && (
                <EditProjectDialog project={{...project, type: project.description || 'Residential'}}>
                  <Button variant="outline" size="sm" className={isMobile ? 'flex-1 text-xs' : ''}>
                    {isMobile ? 'Edit' : 'Edit Project'}
                  </Button>
                </EditProjectDialog>
              )}
              {canViewReports() && (
                <Button size="sm" asChild className={isMobile ? 'flex-1 text-xs' : ''}>
                  <Link to={`/projects/${id}/reports`}>
                    {isMobile ? 'Reports' : 'View Reports'}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
            <Card>
              <CardContent className={isMobile ? "p-3" : "p-4"}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-primary/10 rounded-lg ${isMobile ? 'p-1.5' : ''}`}>
                    <Activity className={`text-primary ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </div>
                  <div>
                    <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Progress</div>
                     <div className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>0%</div>
                   </div>
                 </div>
                 <Progress value={0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className={isMobile ? "p-3" : "p-4"}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-success/10 rounded-lg ${isMobile ? 'p-1.5' : ''}`}>
                    <DollarSign className={`text-success ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </div>
                  <div>
                    <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Budget</div>
                    <div className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                      ${(project.spent / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
                <Progress value={(project.spent / project.budget) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className={isMobile ? "p-3" : "p-4"}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-warning/10 rounded-lg ${isMobile ? 'p-1.5' : ''}`}>
                    <Calendar className={`text-warning ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </div>
                  <div>
                    <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Timeline</div>
                    <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {format(new Date(project.start_date), 'MMM dd')} - {format(new Date(project.end_date), isMobile ? 'MMM dd, yyyy' : 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={isMobile ? "p-3" : "p-4"}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-accent/10 rounded-lg ${isMobile ? 'p-1.5' : ''}`}>
                    <MapPin className={`text-accent-foreground ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </div>
                  <div>
                    <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Location</div>
                    <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{project.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className={`space-y-4 ${isMobile ? 'px-4' : ''}`}>
          {isMobile ? (
            // Mobile: Two rows of tabs
            <div className="space-y-2">
              <div className="flex overflow-x-auto scrollbar-hide gap-1">
                <TabsList className="inline-flex min-w-max">
                  <TabsTrigger value="overview" className="text-xs px-3 py-2 whitespace-nowrap">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="phases" className="text-xs px-3 py-2 whitespace-nowrap">
                    Phases
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs px-3 py-2 whitespace-nowrap">
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="checklists" className="text-xs px-3 py-2 whitespace-nowrap">
                    Lists
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex overflow-x-auto scrollbar-hide gap-1">
                <TabsList className="inline-flex min-w-max">
                  <TabsTrigger value="materials" className="text-xs px-3 py-2 whitespace-nowrap">
                    Materials
                  </TabsTrigger>
                  <TabsTrigger value="labour" className="text-xs px-3 py-2 whitespace-nowrap">
                    Labour
                  </TabsTrigger>
                  <TabsTrigger value="team" className="text-xs px-3 py-2 whitespace-nowrap">
                    Team
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="text-xs px-3 py-2 whitespace-nowrap">
                    Docs
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs px-3 py-2 whitespace-nowrap">
                    Activity
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          ) : (
            // Desktop: Single row
            <TabsList className="grid w-full grid-cols-9">
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
          )}

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
                               {canEditPhase() ? (
                                 <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       className={`${getStatusColor(phase.status)} hover:opacity-80 transition-opacity border-0`}
                                       onClick={(e) => e.stopPropagation()}
                                     >
                                       {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                                       <ChevronDown className="ml-2 h-4 w-4" />
                                     </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent className="z-50 bg-background border border-border shadow-lg">
                                     <DropdownMenuItem 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         updatePhaseStatus.mutate({ phaseId: phase.id, newStatus: 'planning' });
                                       }}
                                       className="cursor-pointer hover:bg-muted"
                                     >
                                       Planning
                                     </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updatePhaseStatus.mutate({ phaseId: phase.id, newStatus: 'active' });
                                        }}
                                        className="cursor-pointer hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                                      >
                                        Active
                                      </DropdownMenuItem>
                                     <DropdownMenuItem 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         updatePhaseStatus.mutate({ phaseId: phase.id, newStatus: 'on-hold' });
                                       }}
                                       className="cursor-pointer hover:bg-muted"
                                     >
                                       On Hold
                                     </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updatePhaseStatus.mutate({ phaseId: phase.id, newStatus: 'completed' });
                                        }}
                                        className="cursor-pointer hover:bg-green-50 text-green-600 hover:text-green-700"
                                      >
                                        Completed
                                      </DropdownMenuItem>
                                     <DropdownMenuItem 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                       updatePhaseStatus.mutate({ phaseId: phase.id, newStatus: 'cancelled' });
                                       }}
                                       className="cursor-pointer hover:bg-muted"
                                     >
                                       Cancelled
                                     </DropdownMenuItem>
                                   </DropdownMenuContent>
                                 </DropdownMenu>
                               ) : (
                                 <Badge variant="outline" className={getStatusColor(phase.status)}>
                                   {phase.status}
                                 </Badge>
                               )}
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
                               <div className="text-sm font-medium">0%</div>
                               <Progress value={0} className="w-20" />
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
            <LabourTracking projectId={id!} />
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

        {/* Quick Assign FAB */}
        {canCreateProject() && (
          <QuickAssignDrawer projectId={id!}>
            <Button 
              size="lg" 
              title="Quick Assign Tasks" 
              className="fixed bottom-[65px] right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
            >
              <Users className="h-6 w-6" />
            </Button>
          </QuickAssignDrawer>
        )}
      </div>
    </AppLayout>
  );
}
