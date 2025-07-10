import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Euro, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface ProjectCostOverviewProps {
  projectId: string;
}

interface ProjectCostSummary {
  totalMaterialCosts: number;
  totalLabourCosts: number;
  totalCosts: number;
  budget: number;
  remainingBudget: number;
  phaseBreakdown: {
    phaseId: string;
    phaseName: string;
    materialCost: number;
    labourCost: number;
    budget: number;
  }[];
}

export function ProjectCostOverview({ projectId }: ProjectCostOverviewProps) {
  const { data: costSummary, isLoading } = useQuery({
    queryKey: ['project-cost-summary', projectId],
    queryFn: async (): Promise<ProjectCostSummary> => {
      // Fetch project budget
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('budget, remaining_budget')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch phases with their costs
      const { data: phases, error: phasesError } = await supabase
        .from('project_phases')
        .select(`
          id,
          name,
          budget,
          material_cost,
          labour_cost
        `)
        .eq('project_id', projectId);

      if (phasesError) throw phasesError;

      // Calculate totals
      const totalMaterialCosts = phases?.reduce((sum, phase) => sum + (phase.material_cost || 0), 0) || 0;
      const totalLabourCosts = phases?.reduce((sum, phase) => sum + (phase.labour_cost || 0), 0) || 0;
      const totalCosts = totalMaterialCosts + totalLabourCosts;

      const phaseBreakdown = phases?.map(phase => ({
        phaseId: phase.id,
        phaseName: phase.name,
        materialCost: phase.material_cost || 0,
        labourCost: phase.labour_cost || 0,
        budget: phase.budget || 0,
      })) || [];

      return {
        totalMaterialCosts,
        totalLabourCosts,
        totalCosts,
        budget: project.budget || 0,
        remainingBudget: project.remaining_budget || 0,
        phaseBreakdown,
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!costSummary) return null;

  const budgetUsagePercentage = costSummary.budget > 0 
    ? (costSummary.totalCosts / costSummary.budget) * 100 
    : 0;

  const isOverBudget = costSummary.totalCosts > costSummary.budget;

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Material Costs</div>
                <div className="text-lg font-semibold">€{costSummary.totalMaterialCosts.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-4 w-4 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Labour Costs</div>
                <div className="text-lg font-semibold">€{costSummary.totalLabourCosts.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Euro className="h-4 w-4 text-warning" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Costs</div>
                <div className="text-lg font-semibold">€{costSummary.totalCosts.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isOverBudget ? 'bg-destructive/10' : 'bg-accent/10'
              }`}>
                {isOverBudget ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-accent-foreground" />
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Remaining Budget</div>
                <div className={`text-lg font-semibold ${
                  isOverBudget ? 'text-destructive' : ''
                }`}>
                  €{costSummary.remainingBudget.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Budget vs. Actual Spending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Budget Usage</span>
              <span className={isOverBudget ? 'text-destructive font-medium' : ''}>
                €{costSummary.totalCosts.toLocaleString()} / €{costSummary.budget.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={budgetUsagePercentage} 
              className={`h-3 ${isOverBudget ? '[&>div]:bg-destructive' : ''}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className={isOverBudget ? 'text-destructive font-medium' : ''}>
                {budgetUsagePercentage.toFixed(1)}%
              </span>
              <span>100%</span>
            </div>
            {isOverBudget && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Project is over budget by €{(costSummary.totalCosts - costSummary.budget).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costSummary.phaseBreakdown.map((phase) => {
              const phaseTotal = phase.materialCost + phase.labourCost;
              const phasePercentage = costSummary.totalCosts > 0 
                ? (phaseTotal / costSummary.totalCosts) * 100 
                : 0;

              return (
                <div key={phase.phaseId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{phase.phaseName}</span>
                    <span className="text-sm text-muted-foreground">
                      €{phaseTotal.toLocaleString()} ({phasePercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials:</span>
                      <span>€{phase.materialCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Labour:</span>
                      <span>€{phase.labourCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <Progress value={phasePercentage} className="h-2" />
                </div>
              );
            })}
            
            {costSummary.phaseBreakdown.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No cost data available for project phases yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}