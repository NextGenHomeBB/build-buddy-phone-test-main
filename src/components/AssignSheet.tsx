import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FixedSizeList as List } from "react-window";
import { useUnassignedTasks, useBulkAssign } from "@/hooks/useTasks";
import { WorkerSelect } from "@/components/WorkerSelect";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface AssignSheetProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignSheet({ projectId, open, onOpenChange }: AssignSheetProps) {
  const { data: tasks = [] } = useUnassignedTasks(projectId);
  const [selectedTasks, setSelected] = useState<string[]>([]);
  const [workerId, setWorker] = useState<string | null>(null);
  const assign = useBulkAssign();
  const { toast } = useToast();

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const handleAssign = async () => {
    if (!workerId || selectedTasks.length === 0) return;
    
    try {
      const assignments = selectedTasks.map(taskId => ({
        taskId,
        userIds: [workerId],
        primaryId: workerId
      }));

      await assign.mutateAsync({ assignments });
      
      toast({
        title: "Tasks Assigned",
        description: `Successfully assigned ${selectedTasks.length} tasks`,
      });

      setSelected([]);
      setWorker(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] p-4">
        <SheetHeader className="text-center">
          <SheetTitle>Bulk-assign tasks</SheetTitle>
        </SheetHeader>

        {/* Tasks */}
        <h3 className="mt-6 text-sm font-semibold">Unassigned Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center">
            🎉 All tasks assigned
          </p>
        ) : (
          <List
            height={180}
            itemCount={tasks.length}
            itemSize={56}
            className="border rounded-md my-2"
            width="100%"
          >
            {({ index, style }) => {
              const t = tasks[index];
              const checked = selectedTasks.includes(t.id);
              return (
                <div
                  style={style}
                  className="flex items-center px-3 gap-3 border-b last:border-none cursor-pointer hover:bg-muted/50"
                  onClick={() => toggle(t.id)}
                >
                  <Checkbox checked={checked} onChange={() => {}} />
                  <div className="flex-1 min-w-0">
                    <span className="truncate font-medium">{t.title}</span>
                    {t.phase && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t.phase.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
          </List>
        )}

        {/* Worker picker */}
        <h3 className="mt-4 text-sm font-semibold">Select Worker</h3>
        <WorkerSelect
          projectId={projectId}
          value={workerId}
          onValueChange={setWorker}
        />

        {/* Footer buttons */}
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!workerId || selectedTasks.length === 0 || assign.isPending}
            onClick={handleAssign}
            className="flex-1"
          >
            {assign.isPending ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}