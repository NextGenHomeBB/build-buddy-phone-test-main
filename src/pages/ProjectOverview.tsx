import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch project data with phases
  const { data: project, isLoading } = useOfflineQuery(
    ['projects', id],
    async () => {
      if (!id) return null;

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          phases:project_phases(*)
        `)
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      return projectData;
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('Project not found')}</p>
      </div>
    );
  }

  // Calculate completion percentage
  const phases = project.phases || [];
  const completedPhases = phases.filter((phase: any) => phase.status === 'completed').length;
  const totalPhases = phases.length;
  const completionPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  // Get key dates
  const startDate = project.start_date ? new Date(project.start_date) : null;
  const endDate = project.end_date ? new Date(project.end_date) : null;
  const latestPhase = phases
    .filter((phase: any) => phase.status === 'active' || phase.status === 'completed')
    .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  const handleSeeGantt = () => {
    navigate(`/projects/${id}/phases#gantt`);
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('Project Progress')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t('Overall Completion')}</span>
              <span className="text-2xl font-bold text-primary">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedPhases} {t('completed')}</span>
              <span>{totalPhases} {t('total phases')}</span>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSeeGantt} className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('See Gantt Chart')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('Key Dates')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="font-medium">{t('Start Date')}</span>
              <span className="text-muted-foreground">
                {startDate ? format(startDate, 'MMM dd, yyyy') : t('Not set')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="font-medium">{t('Expected Finish')}</span>
              <span className="text-muted-foreground">
                {endDate ? format(endDate, 'MMM dd, yyyy') : t('Not set')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="font-medium">{t('Latest Phase')}</span>
              <span className="text-muted-foreground">
                {latestPhase ? latestPhase.name : t('No active phases')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}