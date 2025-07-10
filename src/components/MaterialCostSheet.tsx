import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Calculator, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInsertMaterialCost, useEstimatePhaseCosts } from '@/services/phaseCosts.service';

const materialCostSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  qty: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.number().min(0.01, 'Unit price must be greater than 0'),
});

type MaterialCostForm = z.infer<typeof materialCostSchema>;

interface MaterialCostSheetProps {
  phaseId: string;
  open: boolean;
  onClose: () => void;
}

const categories = [
  'Concrete & Masonry',
  'Steel & Metal',
  'Wood & Lumber',
  'Electrical',
  'Plumbing',
  'Insulation',
  'Roofing',
  'Windows & Doors',
  'Flooring',
  'Paint & Finishes',
  'Hardware',
  'Other'
];

const units = [
  'm²',
  'm³',
  'm',
  'kg',
  'ton',
  'piece',
  'box',
  'bag',
  'liter',
  'roll',
  'panel',
  'sheet'
];

export function MaterialCostSheet({ phaseId, open, onClose }: MaterialCostSheetProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  
  const insertMaterialCostMutation = useInsertMaterialCost();
  const estimatePhaseCostsMutation = useEstimatePhaseCosts();

  const form = useForm<MaterialCostForm>({
    resolver: zodResolver(materialCostSchema),
    defaultValues: {
      description: '',
      category: '',
      qty: 0,
      unit: '',
      unit_price: 0,
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;

  const handleAICalculator = async () => {
    const description = watch('description');
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a material description first",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      const estimate = await estimatePhaseCostsMutation.mutateAsync(phaseId);
      
      // Simple heuristic: divide material estimate by 10 items as starting point
      const estimatedQty = Math.max(1, Math.round(estimate.materials / 1000));
      const estimatedPrice = estimate.materials > 0 ? Math.round(estimate.materials / estimatedQty) : 100;
      
      setValue('qty', estimatedQty);
      setValue('unit_price', estimatedPrice);
      
      toast({
        title: "AI Estimation Complete",
        description: `Suggested quantity: ${estimatedQty}, price: €${estimatedPrice}`,
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

  const onSubmit = async (data: MaterialCostForm) => {
    try {
      await insertMaterialCostMutation.mutateAsync({
        phase_id: phaseId,
        category: data.category,
        qty: data.qty,
        unit: data.unit,
        unit_price: data.unit_price,
      });

      toast({
        title: "Material Cost Added",
        description: `${data.description} - €${(data.qty * data.unit_price).toFixed(2)}`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to Add Material Cost",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const total = watch('qty') * watch('unit_price');

  return (
    <BottomSheet open={open} onOpenChange={onClose}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Material Cost</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="e.g. Premium concrete mix"
              className="w-full"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => setValue('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                step="0.01"
                min="0.01"
                {...register('qty', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.qty && (
                <p className="text-sm text-destructive">{errors.qty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select onValueChange={(value) => setValue('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_price">Unit Price (€)</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              min="0.01"
              {...register('unit_price', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.unit_price && (
              <p className="text-sm text-destructive">{errors.unit_price.message}</p>
            )}
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
              disabled={insertMaterialCostMutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {insertMaterialCostMutation.isPending ? 'Saving...' : 'Save Cost'}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}