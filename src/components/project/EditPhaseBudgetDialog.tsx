import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface EditPhaseBudgetDialogProps {
  phase: {
    id: string;
    name: string;
    budget: number;
    material_cost?: number;
    labour_cost?: number;
  };
  children: React.ReactNode;
}

export function EditPhaseBudgetDialog({ phase, children }: EditPhaseBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState(phase.budget?.toString() || '0');
  const [materialCost, setMaterialCost] = useState(phase.material_cost?.toString() || '0');
  const [labourCost, setLabourCost] = useState(phase.labour_cost?.toString() || '0');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBudget = useMutation({
    mutationFn: async () => {
      const budgetValue = parseFloat(budget) || 0;
      const materialValue = parseFloat(materialCost) || 0;
      const labourValue = parseFloat(labourCost) || 0;

      const { data, error } = await supabase
        .from('project_phases')
        .update({
          budget: budgetValue,
          material_cost: materialValue,
          labour_cost: labourValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', phase.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', phase.id] });
      queryClient.invalidateQueries({ queryKey: ['phase-costs', phase.id] });
      toast({
        title: "Budget Updated",
        description: `Phase "${phase.name}" budget has been updated successfully.`,
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error('Error updating phase budget:', error);
      toast({
        title: "Error",
        description: "Failed to update phase budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudget.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Edit Phase Budget
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter total budget"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="materialCost">Material Cost</Label>
              <Input
                id="materialCost"
                type="number"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                placeholder="Enter material cost"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="labourCost">Labour Cost</Label>
              <Input
                id="labourCost"
                type="number"
                value={labourCost}
                onChange={(e) => setLabourCost(e.target.value)}
                placeholder="Enter labour cost"
                min="0"
                step="0.01"
              />
            </div>

            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <strong>Total estimated cost:</strong> ${((parseFloat(materialCost) || 0) + (parseFloat(labourCost) || 0)).toLocaleString()}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBudget.isPending}>
              {updateBudget.isPending ? 'Updating...' : 'Update Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}