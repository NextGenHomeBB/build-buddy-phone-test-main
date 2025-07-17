import { useParams, Link } from 'react-router-dom';
import { useProject, useProjectPhases } from '@/hooks/useProjects';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Activity, 
  Users, 
  FileText, 
  Download,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ProjectReports() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: phases } = useProjectPhases(id!);

  // Fetch project tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch labour entries
  const { data: labourEntries = [] } = useQuery({
    queryKey: ['project-labour', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('labour_entries')
        .select('*')
        .eq('project_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch project materials
  const { data: materials = [] } = useQuery({
    queryKey: ['project-materials', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_materials')
        .select(`
          *,
          material:materials(name, unit)
        `)
        .eq('project_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  // Calculate metrics
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const totalLabourHours = labourEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
  const totalLabourCost = labourEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);

  const totalMaterialCost = materials.reduce((sum, material) => sum + (material.total_cost || 0), 0);

  const activePhasesCount = phases?.filter(phase => phase.status === 'active').length || 0;
  const completedPhasesCount = phases?.filter(phase => phase.status === 'completed').length || 0;
  const totalPhases = phases?.length || 0;

  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  ).length;

  const budgetUtilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/projects/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Link>
          </Button>
        </div>

        {/* Project Info */}
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Project Reports: {project.name}
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and reporting for project performance
          </p>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Project Progress</div>
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
                  <div className="text-sm text-muted-foreground">Budget Utilization</div>
                  <div className="text-lg font-semibold">{budgetUtilization.toFixed(1)}%</div>
                </div>
              </div>
              <Progress value={budgetUtilization} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <FileText className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Task Completion</div>
                  <div className="text-lg font-semibold">{taskCompletionRate.toFixed(1)}%</div>
                </div>
              </div>
              <Progress value={taskCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Overdue Tasks</div>
                  <div className="text-lg font-semibold">{overdueTasks}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Summary
              </CardTitle>
              <CardDescription>
                Budget breakdown and cost analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Budget</span>
                  <span className="font-semibold">${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Spent</span>
                  <span className="font-semibold">${project.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Labour Costs</span>
                  <span className="font-semibold">${totalLabourCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Material Costs</span>
                  <span className="font-semibold">${totalMaterialCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Remaining Budget</span>
                  <span className={`font-semibold ${project.remaining_budget >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${project.remaining_budget.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Task Analytics
              </CardTitle>
              <CardDescription>
                Task completion and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Tasks</span>
                  <span className="font-semibold">{totalTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Tasks</span>
                  <span className="font-semibold text-success">{completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">In Progress</span>
                  <span className="font-semibold text-warning">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overdue Tasks</span>
                  <span className="font-semibold text-destructive">{overdueTasks}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="font-semibold">{taskCompletionRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Phase Progress
              </CardTitle>
              <CardDescription>
                Current status of project phases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Phases</span>
                  <span className="font-semibold">{totalPhases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Phases</span>
                  <span className="font-semibold text-warning">{activePhasesCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Phases</span>
                  <span className="font-semibold text-success">{completedPhasesCount}</span>
                </div>
              </div>
              {phases && phases.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <span className="text-sm font-medium">Phase Details:</span>
                  {phases.map((phase) => (
                    <div key={phase.id} className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{phase.name}</span>
                      <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                        {phase.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Tracking
              </CardTitle>
              <CardDescription>
                Labour hours and time analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Labour Hours</span>
                  <span className="font-semibold">{totalLabourHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Labour Entries</span>
                  <span className="font-semibold">{labourEntries.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Cost/Hour</span>
                  <span className="font-semibold">
                    ${totalLabourHours > 0 ? (totalLabourCost / totalLabourHours).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Project Duration</span>
                  <span className="font-semibold">
                    {format(new Date(project.start_date), 'MMM dd')} - {format(new Date(project.end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Export Reports</CardTitle>
            <CardDescription>
              Download detailed reports for analysis and sharing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Financial Report
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Task Report
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Time Report
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}