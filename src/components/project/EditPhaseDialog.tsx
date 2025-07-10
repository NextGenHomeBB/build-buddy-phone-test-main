import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePhaseBudget } from "@/hooks/usePhaseBudget";
import { Bot, Calculator } from "lucide-react";

interface EditPhaseDialogProps {
  phase: {
    id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    budget: number;
    material_cost?: number;
    labour_cost?: number;
    status: string;
  };
  projectId: string;
  children: React.ReactNode;
}

interface PhaseFormData {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  material_cost: number;
  labour_cost: number;
  status: string;
}

export function EditPhaseDialog({ phase, projectId, children }: EditPhaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [showAIEstimate, setShowAIEstimate] = useState(false);
  const [estimateParams, setEstimateParams] = useState({
    phaseType: 'structure',
    area: 100,
    complexity: 'medium' as const,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { estimateCosts, isEstimating } = usePhaseBudget();

  const form = useForm<PhaseFormData>({
    defaultValues: {
      name: phase.name,
      description: phase.description || "",
      start_date: phase.start_date || "",
      end_date: phase.end_date || "",
      material_cost: phase.material_cost || 0,
      labour_cost: phase.labour_cost || 0,
      status: phase.status,
    },
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async (data: PhaseFormData) => {
      const { data: updatedPhase, error } = await supabase
        .from('project_phases')
        .update({
          name: data.name,
          description: data.description,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          material_cost: data.material_cost,
          labour_cost: data.labour_cost,
          status: data.status as any,
        })
        .eq('id', phase.id)
        .select()
        .single();

      if (error) throw error;
      return updatedPhase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'phases'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast({
        title: "Phase updated",
        description: "The phase has been updated successfully.",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update phase",
        variant: "destructive",
      });
    },
  });

  const handleAIEstimate = async () => {
    try {
      const estimate = await estimateCosts(estimateParams);
      form.setValue('material_cost', estimate.material);
      form.setValue('labour_cost', estimate.labour);
      setShowAIEstimate(false);
      toast({
        title: "AI Estimate Complete",
        description: `Material: $${estimate.material.toLocaleString()}, Labour: $${estimate.labour.toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate estimate",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: PhaseFormData) => {
    // Validate dates
    if (data.start_date && data.end_date && data.start_date > data.end_date) {
      toast({
        title: "Invalid dates",
        description: "Start date cannot be later than end date",
        variant: "destructive",
      });
      return;
    }
    updatePhaseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Phase</DialogTitle>
          <DialogDescription>
            Update phase details, planning, and costs.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Phase name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phase Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Foundation & Structure" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of this phase..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Cost Breakdown</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIEstimate(true)}
                  disabled={isEstimating}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI Estimate
                </Button>
              </div>

              {showAIEstimate && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">Phase Type</label>
                      <Select 
                        value={estimateParams.phaseType} 
                        onValueChange={(value) => setEstimateParams(prev => ({ ...prev, phaseType: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="foundation">Foundation</SelectItem>
                          <SelectItem value="structure">Structure</SelectItem>
                          <SelectItem value="roofing">Roofing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="finishing">Finishing</SelectItem>
                          <SelectItem value="landscaping">Landscaping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Area (m²)</label>
                      <Input
                        type="number"
                        value={estimateParams.area}
                        onChange={(e) => setEstimateParams(prev => ({ ...prev, area: Number(e.target.value) }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Complexity</label>
                      <Select 
                        value={estimateParams.complexity} 
                        onValueChange={(value: any) => setEstimateParams(prev => ({ ...prev, complexity: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleAIEstimate} disabled={isEstimating} size="sm">
                      <Calculator className="h-4 w-4 mr-2" />
                      {isEstimating ? "Calculating..." : "Calculate"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAIEstimate(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="material_cost"
                  rules={{ min: { value: 0, message: "Cost must be positive" } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labour_cost"
                  rules={{ min: { value: 0, message: "Cost must be positive" } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labour Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Total Cost: ${((form.watch('material_cost') || 0) + (form.watch('labour_cost') || 0)).toLocaleString()}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePhaseMutation.isPending}>
                {updatePhaseMutation.isPending ? "Updating..." : "Update Phase"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}