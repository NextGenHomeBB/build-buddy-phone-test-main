import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Calculator, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInsertLabourCost, useEstimatePhaseCosts } from '@/services/phaseCosts.service';

const labourCostSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  subcontractor_id: z.string().optional(),
  hours: z.number().min(0.01, 'Hours must be greater than 0'),
  rate: z.number().min(0.01, 'Rate must be greater than 0'),
  bill_per_hour: z.boolean().default(true),
});

type LabourCostForm = z.infer<typeof labourCostSchema>;

interface LabourCostSheetProps {
  phaseId: string;
  open: boolean;
  onClose: () => void;
}

const subcontractors = [
  { id: 'internal', name: 'Internal Team' },
  { id: 'electrician-1', name: 'Smith Electrical Ltd.' },
  { id: 'plumber-1', name: 'Johnson Plumbing Co.' },
  { id: 'carpenter-1', name: 'Wood Masters Inc.' },
  { id: 'painter-1', name: 'Color Pro Painters' },
  { id: 'concrete-1', name: 'Concrete Solutions LLC' },
  { id: 'roofing-1', name: 'Apex Roofing Services' },
  { id: 'hvac-1', name: 'Climate Control Systems' },
  { id: 'flooring-1', name: 'Premium Flooring Co.' },
];

export function LabourCostSheet({ phaseId, open, onClose }: LabourCostSheetProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  
  const insertLabourCostMutation = useInsertLabourCost();
  const estimatePhaseCostsMutation = useEstimatePhaseCosts();

  const form = useForm<LabourCostForm>({
    resolver: zodResolver(labourCostSchema),
    defaultValues: {
      description: '',
      subcontractor_id: '',
      hours: 0,
      rate: 0,
      bill_per_hour: true,
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;

  const handleAICalculator = async () => {
    const description = watch('description');
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a task description first",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      const estimate = await estimatePhaseCostsMutation.mutateAsync(phaseId);
      
      // Simple heuristic: estimate hours based on labour cost and average hourly rate
      const avgHourlyRate = 45; // €45/hour average
      const estimatedHours = estimate.labour > 0 ? Math.max(1, Math.round(estimate.labour / avgHourlyRate)) : 8;
      const estimatedRate = estimate.labour > 0 ? Math.round(estimate.labour / estimatedHours) : avgHourlyRate;
      
      setValue('hours', estimatedHours);
      setValue('rate', estimatedRate);
      
      toast({
        title: "AI Estimation Complete",
        description: `Suggested hours: ${estimatedHours}, rate: €${estimatedRate}/hr`,
      });
    } catch (error) {
      toast({
        title: "AI Estimation Failed",
        description: "Could not generate cost estimate. Please enter values manually.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const onSubmit = async (data: LabourCostForm) => {
    try {
      await insertLabourCostMutation.mutateAsync({
        phase_id: phaseId,
        task: data.description,
        subcontractor_id: data.subcontractor_id || undefined,
        hours: data.hours,
        rate: data.rate,
      });

      toast({
        title: "Labour Cost Added",
        description: `${data.description} - €${(data.hours * data.rate).toFixed(2)}`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to Add Labour Cost",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const billPerHour = watch('bill_per_hour');
  const hours = watch('hours');
  const rate = watch('rate');
  const total = hours * rate;

  return (
    <BottomSheet open={open} onOpenChange={onClose}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Labour Cost</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Task Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="e.g. Electrical wiring installation"
              className="w-full"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcontractor">Subcontractor</Label>
            <Select onValueChange={(value) => setValue('subcontractor_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select subcontractor (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {subcontractors.map((contractor) => (
                  <SelectItem key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="bill_per_hour" className="text-sm font-medium">
              Bill per hour
            </Label>
            <Switch
              id="bill_per_hour"
              checked={billPerHour}
              onCheckedChange={(checked) => setValue('bill_per_hour', checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.01"
                {...register('hours', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.hours && (
                <p className="text-sm text-destructive">{errors.hours.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">
                {billPerHour ? 'Rate (€/hr)' : 'Fixed Rate (€)'}
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0.01"
                {...register('rate', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.rate && (
                <p className="text-sm text-destructive">{errors.rate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <span className="text-sm text-muted-foreground">Total Cost:</span>
            <span className="text-lg font-semibold">
              €{total ? total.toFixed(2) : '0.00'}
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAICalculator}
              disabled={isCalculating}
              className="flex-1"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculating...' : 'AI Calculator'}
            </Button>

            <Button
              type="submit"
              disabled={insertLabourCostMutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {insertLabourCostMutation.isPending ? 'Saving...' : 'Save Cost'}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}