import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, CheckSquare, ClipboardList } from 'lucide-react';
import { useProjectChecklists } from '@/hooks/useProjectChecklists';
import { useAvailableChecklists, useAssignChecklistToProject, useUnassignChecklistFromProject } from '@/hooks/useProjectChecklistAssignment';

interface ProjectChecklistsTabProps {
  projectId: string;
}

export function ProjectChecklistsTab({ projectId }: ProjectChecklistsTabProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  
  const { data: projectChecklists = [], isLoading: projectChecklistsLoading } = useProjectChecklists(projectId);
  const { data: availableChecklists = [], isLoading: availableChecklistsLoading } = useAvailableChecklists(projectId);
  const assignChecklistMutation = useAssignChecklistToProject();
  const unassignChecklistMutation = useUnassignChecklistFromProject();

  const handleAssignChecklist = (checklistId: string) => {
    assignChecklistMutation.mutate({ projectId, checklistId });
    setIsAssignDialogOpen(false);
  };

  const handleUnassignChecklist = (checklistId: string) => {
    unassignChecklistMutation.mutate({ projectId, checklistId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project Checklists</h2>
          <p className="text-muted-foreground">
            Manage checklist templates assigned to this project
          </p>
        </div>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Checklist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Checklist Template</DialogTitle>
              <DialogDescription>
                Select a checklist template to assign to this project
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableChecklistsLoading ? (
                <div className="text-center p-4 text-muted-foreground">
                  Loading available checklists...
                </div>
              ) : availableChecklists.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No available checklist templates found. Create templates in Admin → Checklists first.
                </div>
              ) : (
                availableChecklists.map((checklist) => {
                  const itemCount = Array.isArray(checklist.items) ? checklist.items.length : 0;
                  return (
                    <Card key={checklist.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleAssignChecklist(checklist.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{checklist.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <CheckSquare className="h-3 w-3" />
                              {itemCount} items
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {checklist.description && (
                          <p className="text-xs text-muted-foreground mt-2">{checklist.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assigned Checklists */}
      <div className="space-y-4">
        {projectChecklistsLoading ? (
          <div className="text-center p-8 text-muted-foreground">
            Loading project checklists...
          </div>
        ) : projectChecklists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No checklists assigned</h3>
              <p className="text-muted-foreground mb-4">
                Assign checklist templates to this project to create tasks for workers.
              </p>
              <Button onClick={() => setIsAssignDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign First Checklist
              </Button>
            </CardContent>
          </Card>
        ) : (
          projectChecklists.map((checklist) => {
            const itemCount = Array.isArray(checklist.items) ? checklist.items.length : 0;
            return (
              <Card key={checklist.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/admin/checklists`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{checklist.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-3 w-3" />
                          {itemCount} items
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnassignChecklist(checklist.id);
                      }}
                      disabled={unassignChecklistMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {checklist.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{checklist.description}</p>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}