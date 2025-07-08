import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUpdateProject } from '@/hooks/useProjects';
import { userService, UserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Loader2, Edit } from 'lucide-react';

interface ProjectManagerSelectorProps {
  projectId: string;
  currentManagerId?: string;
  currentManagerName?: string;
}

export function ProjectManagerSelector({ 
  projectId, 
  currentManagerId, 
  currentManagerName 
}: ProjectManagerSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>(currentManagerId || '');
  
  const { mutate: updateProject, isPending } = useUpdateProject();
  const { toast } = useToast();
  const { canEditProject } = useRoleAccess();

  useEffect(() => {
    if (isEditing) {
      loadManagers();
    }
  }, [isEditing]);

  const loadManagers = async () => {
    setLoadingManagers(true);
    try {
      const users = await userService.getAllUsers();
      const availableManagers = users.filter(user => 
        user.role === 'admin' || user.role === 'manager'
      );
      setManagers(availableManagers);
    } catch (error) {
      console.error('Error loading managers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load managers',
        variant: 'destructive',
      });
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleSave = () => {
    const managerId = selectedManagerId === 'unassigned' ? null : selectedManagerId;
    
    updateProject(
      {
        id: projectId,
        updates: {
          manager_id: managerId,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Project manager updated successfully',
          });
          setIsEditing(false);
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: 'Failed to update project manager',
            variant: 'destructive',
          });
          console.error('Error updating project manager:', error);
        },
      }
    );
  };

  const handleCancel = () => {
    setSelectedManagerId(currentManagerId || '');
    setIsEditing(false);
  };

  if (!canEditProject()) {
    return <span className="font-medium">{currentManagerName || 'Unassigned'}</span>;
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{currentManagerName || 'Unassigned'}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-6 w-6 p-0"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-[150px]">
        {loadingManagers ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <Select 
            value={selectedManagerId} 
            onValueChange={setSelectedManagerId}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {managers.map((manager) => (
                <SelectItem key={manager.user_id} value={manager.user_id}>
                  {manager.name} ({manager.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isPending || loadingManagers}
          className="h-8 px-2"
        >
          {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
          className="h-8 px-2"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}