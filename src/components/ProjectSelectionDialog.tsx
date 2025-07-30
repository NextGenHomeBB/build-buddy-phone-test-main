
import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAccessibleProjects } from '@/hooks/useProjects';

interface ProjectSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectsSelected: (projectIds: string[]) => void;
  isCreating: boolean;
}

export function ProjectSelectionDialog({ 
  open, 
  onOpenChange, 
  onProjectsSelected, 
  isCreating 
}: ProjectSelectionDialogProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { data: projects = [], isLoading } = useAccessibleProjects();

  const availableProjects = projects.filter(project => 
    project.status === 'active' || project.status === 'draft'
  );

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === availableProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(availableProjects.map(p => p.id));
    }
  };

  const handleCreateSchedule = () => {
    if (selectedProjects.length > 0) {
      onProjectsSelected(selectedProjects);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setSelectedProjects([]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Projects for Schedule</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : availableProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active or planning projects found.</p>
              <p className="text-sm mt-2">Create some projects first to generate schedule items.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedProjects.length} of {availableProjects.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isCreating}
                >
                  {selectedProjects.length === availableProjects.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={project.id}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                      disabled={isCreating}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={project.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {project.name}
                        </label>
                        <Badge 
                          variant={project.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSchedule}
            disabled={selectedProjects.length === 0 || isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Schedule ({selectedProjects.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
