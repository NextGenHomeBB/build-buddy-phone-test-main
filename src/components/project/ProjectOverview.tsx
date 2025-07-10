import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProjectCostOverview } from '@/components/ProjectCostOverview';
import { 
  Calendar, 
  BarChart3,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ProjectOverviewProps {
  project: any;
  phases?: any[];
}

export function ProjectOverview({ project, phases }: ProjectOverviewProps) {
  // Calculate latest phase
  const latestPhase = phases?.reduce((latest, phase) => {
    if (!latest) return phase;
    const phaseDate = new Date(phase.updated_at || phase.created_at);
    const latestDate = new Date(latest.updated_at || latest.created_at);
    return phaseDate > latestDate ? phase : latest;
  }, null);

  // Calculate expected finish date (could be end_date or latest phase end_date)
  const expectedFinish = latestPhase?.end_date 
    ? new Date(latestPhase.end_date) 
    : new Date(project.end_date);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Project Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>
          
          {project.progress < 100 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>
                {phases?.filter(p => p.status === 'active').length || 0} active phases in progress
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium">Project Start</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(project.start_date), 'MMM dd, yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-sm font-medium">Expected Finish</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(expectedFinish, 'MMM dd, yyyy')}
              </span>
            </div>

            {latestPhase && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Latest Phase</span>
                    <span className="text-xs text-muted-foreground">{latestPhase.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {latestPhase.end_date 
                      ? format(new Date(latestPhase.end_date), 'MMM dd, yyyy')
                      : 'No end date'
                    }
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {latestPhase.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Timeline Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View detailed project timeline and phase dependencies in Gantt chart format.
            </p>
            
            <Button asChild className="w-full">
              <Link to={`/projects/${project.id}/phase/${phases?.[0]?.id || 'gantt'}#gantt`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                See Gantt Chart
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{phases?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Total Phases</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {phases?.filter(p => p.status === 'completed').length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-warning">
                ${(project.spent / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-muted-foreground">Spent</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-muted-foreground">
                ${((project.budget - project.spent) / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Overview */}
      <ProjectCostOverview projectId={project.id} />
    </div>
  );
}