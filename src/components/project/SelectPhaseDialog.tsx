import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { defaultPhases } from "@/templates/defaultPhases";
import { Search, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SelectPhaseDialogProps {
  projectId: string;
  children: React.ReactNode;
}

export function SelectPhaseDialog({ projectId, children }: SelectPhaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhases, setSelectedPhases] = useState<Set<number>>(new Set());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredPhases = defaultPhases.filter(phase =>
    phase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phase.checklist.some(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const addPhasesMutation = useMutation({
    mutationFn: async (phaseIndices: number[]) => {
      const today = new Date();
      const phasesToAdd = phaseIndices.map((index, sequenceIndex) => {
        const phase = defaultPhases[index];
        
        // Set sequential default dates: each phase starts 2 weeks after the previous one
        const startDate = new Date(today);
        startDate.setDate(today.getDate() + (sequenceIndex * 14)); // 2 weeks apart
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 13); // 2 weeks duration by default
        
        return {
          project_id: projectId,
          name: phase.name,
          description: `Phase includes: ${phase.checklist.slice(0, 3).join(', ')}${phase.checklist.length > 3 ? '...' : ''}`,
          status: 'planning' as const,
          progress: 0,
          budget: 0,
          spent: 0,
          material_cost: 0,
          labour_cost: 0,
          start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          end_date: endDate.toISOString().split('T')[0],
        };
      });

      const { data, error } = await supabase
        .from('project_phases')
        .insert(phasesToAdd)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases', projectId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'phases'] });
      toast({
        title: "Phases added",
        description: `Successfully added ${data.length} phase(s) to the project.`,
      });
      setOpen(false);
      setSelectedPhases(new Set());
      setSearchTerm("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add phases",
        variant: "destructive",
      });
    },
  });

  const handlePhaseToggle = (index: number) => {
    const newSelected = new Set(selectedPhases);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPhases(newSelected);
  };

  const handleAddSelected = () => {
    if (selectedPhases.size === 0) {
      toast({
        title: "No phases selected",
        description: "Please select at least one phase to add.",
        variant: "destructive",
      });
      return;
    }
    addPhasesMutation.mutate(Array.from(selectedPhases));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose Construction Phases</DialogTitle>
          <DialogDescription>
            Select from predefined construction phases to add to your project. Each phase includes relevant tasks and checklists.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search phases or tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedPhases.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedPhases.size} phase(s) selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPhases(new Set())}
              >
                Clear all
              </Button>
            </div>
          )}

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredPhases.map((phase, originalIndex) => {
                const phaseIndex = defaultPhases.findIndex(p => p.name === phase.name);
                const isSelected = selectedPhases.has(phaseIndex);
                
                return (
                  <div
                    key={phaseIndex}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handlePhaseToggle(phaseIndex)}
                  >
                    <div className="flex items-start gap-3">
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-sm">{phase.name}</h4>
                        
                        <div className="flex flex-wrap gap-1">
                          {phase.checklist.slice(0, 3).map((item, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {item.length > 30 ? `${item.substring(0, 30)}...` : item}
                            </Badge>
                          ))}
                          {phase.checklist.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{phase.checklist.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {filteredPhases.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No phases found matching "{searchTerm}"
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddSelected}
            disabled={selectedPhases.size === 0 || addPhasesMutation.isPending}
          >
            {addPhasesMutation.isPending 
              ? "Adding..." 
              : `Add ${selectedPhases.size} Phase${selectedPhases.size !== 1 ? 's' : ''}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}