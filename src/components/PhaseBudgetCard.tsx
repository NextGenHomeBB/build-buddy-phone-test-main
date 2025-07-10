import { useState, useEffect } from 'react';
import { usePhaseBudget, usePhaseBudgetMutation } from '@/services/phasePlanning.service';
import { usePhaseBudget as usePhaseEstimate } from '@/hooks/usePhaseBudget';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Bot, Euro, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhaseBudgetCardProps {
  phaseId: string;
}

interface InputCurrencyProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
}

function InputCurrency({ label, value, onChange, onBlur, placeholder }: InputCurrencyProps) {
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    setDisplayValue(rawValue);
    const numValue = parseFloat(rawValue) || 0;
    onChange(numValue);
  };

  const handleBlur = () => {
    const numValue = parseFloat(displayValue) || 0;
    setDisplayValue(numValue.toString());
    onBlur?.();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <div className="relative">
        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={label}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder || "0"}
          className="pl-10"
        />
      </div>
    </div>
  );
}

export function PhaseBudgetCard({ phaseId }: PhaseBudgetCardProps) {
  const { phase, isLoading } = usePhaseBudget(phaseId);
  const { estimateCosts, isEstimating } = usePhaseEstimate();
  const budgetMutation = usePhaseBudgetMutation();
  const { toast } = useToast();

  const [materialCost, setMaterialCost] = useState(0);
  const [labourCost, setLabourCost] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Get project data for remaining budget
  const { data: project } = useQuery({
    queryKey: ['project', phase?.project_id],
    queryFn: async () => {
      if (!phase?.project_id) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('budget, spent')
        .eq('id', phase.project_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!phase?.project_id,
  });

  // Update local state when phase data loads
  useEffect(() => {
    if (phase) {
      setMaterialCost(phase.material_cost || 0);
      setLabourCost(phase.labour_cost || 0);
      setHasChanges(false);
    }
  }, [phase]);

  const handleMaterialChange = (value: number) => {
    setMaterialCost(value);
    setHasChanges(true);
  };

  const handleLabourChange = (value: number) => {
    setLabourCost(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!phase) return;

    budgetMutation.mutate({
      phaseId: phase.id,
      materialCost,
      labourCost,
      projectId: phase.project_id,
    }, {
      onSuccess: () => {
        setHasChanges(false);
      },
    });
  };

  const handleAIEstimate = async () => {
    if (!phase) return;

    try {
      // Use basic estimation parameters - could be enhanced with phase-specific data
      const estimate = await estimateCosts({
        phaseType: phase.name.toLowerCase().includes('foundation') ? 'foundation' :
                   phase.name.toLowerCase().includes('structure') ? 'structure' :
                   phase.name.toLowerCase().includes('roof') ? 'roofing' :
                   phase.name.toLowerCase().includes('electrical') ? 'electrical' :
                   phase.name.toLowerCase().includes('plumbing') ? 'plumbing' :
                   phase.name.toLowerCase().includes('finish') ? 'finishing' :
                   'structure',
        area: 100, // Default area - could be enhanced with project-specific data
        complexity: 'medium',
      });

      setMaterialCost(estimate.material);
      setLabourCost(estimate.labour);
      setHasChanges(true);

      toast({
        title: "AI Estimate Complete",
        description: `Materialen: €${estimate.material.toLocaleString()}, Arbeid: €${estimate.labour.toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI estimate",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!phase) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Phase not found
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCost = materialCost + labourCost;
  const remainingBudget = project ? (project.budget - project.spent) : 0;
  const budgetStatus = totalCost > remainingBudget ? 'destructive' : 
                      totalCost > remainingBudget * 0.8 ? 'secondary' : 'default';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{phase.name} - Budget</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={budgetStatus}>
              Remaining: €{remainingBudget.toLocaleString()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputCurrency
            label="Materialen (€)"
            value={materialCost}
            onChange={handleMaterialChange}
            onBlur={hasChanges ? handleSave : undefined}
            placeholder="0"
          />
          
          <InputCurrency
            label="Arbeid (€)"
            value={labourCost}
            onChange={handleLabourChange}
            onBlur={hasChanges ? handleSave : undefined}
            placeholder="0"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Budget</div>
            <div className="text-2xl font-bold">€{totalCost.toLocaleString()}</div>
            {totalCost > remainingBudget && (
              <div className="text-sm text-destructive">
                Exceeds remaining budget by €{(totalCost - remainingBudget).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIEstimate}
              disabled={isEstimating}
            >
              <Bot className="h-4 w-4 mr-2" />
              {isEstimating ? "Calculating..." : "AI Estimate"}
            </Button>

            {hasChanges && (
              <Button size="sm" onClick={handleSave} disabled={budgetMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {budgetMutation.isPending ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Previous Budget</div>
              <div className="font-medium">€{phase.budget.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Budget Change</div>
              <div className={`font-medium ${
                totalCost > phase.budget ? 'text-destructive' : 
                totalCost < phase.budget ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {totalCost > phase.budget ? '+' : ''}
                €{(totalCost - phase.budget).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}