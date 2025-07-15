import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useUnassignedTasks, useBulkAssign } from '@/hooks/useTasks';
import { useUnassignedChecklistItems } from '@/hooks/useUnassignedChecklistItems';
import { useBulkAssignChecklistItems } from '@/hooks/useBulkAssignChecklistItems';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Users, Search, CheckSquare, UserPlus, Zap, ListTodo, ClipboardList } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

interface Worker {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  project: { name: string } | null;
  phase: { name: string } | null;
  priority: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  project: { name: string } | null;
  checklist: { name: string } | null;
  priority?: string;
  projectChecklistId: string;
}

type AssignableItem = Task | ChecklistItem;

function isChecklistItem(item: AssignableItem): item is ChecklistItem {
  return 'checklist' in item && 'projectChecklistId' in item;
}

interface QuickAssignDrawerProps {
  projectId?: string;
  children: React.ReactNode;
}

type AssignMode = 'tasks' | 'checklist';

const ItemRow = ({ index, style, data }: { 
  index: number; 
  style: any; 
  data: { items: AssignableItem[]; selectedItems: Set<string>; onItemToggle: (id: string) => void; isMobile: boolean; } 
}) => {
  const item = data.items[index];
  const isSelected = data.selectedItems.has(item.id);

  return (
    <div style={style} className="px-2">
      <div 
        className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors touch-manipulation ${
          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
        } ${data.isMobile ? 'min-h-[60px]' : ''}`}
        onClick={() => data.onItemToggle(item.id)}
      >
        <Checkbox 
          checked={isSelected} 
          onChange={() => {}} 
          className={data.isMobile ? 'h-5 w-5' : 'h-4 w-4'}
        />
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${data.isMobile ? 'text-base' : 'text-sm'}`}>
            {item.title}
          </h4>
          <p className={`text-muted-foreground truncate ${data.isMobile ? 'text-sm' : 'text-xs'}`}>
            {item.project?.name} {isChecklistItem(item) ? `• ${item.checklist?.name}` : item.phase && `• ${item.phase.name}`}
          </p>
        </div>
        <Badge variant="outline" className={data.isMobile ? 'text-sm px-2' : 'text-xs'}>
          {item.priority || 'medium'}
        </Badge>
      </div>
    </div>
  );
};

export function QuickAssignDrawer({ projectId, children }: QuickAssignDrawerProps) {
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignMode, setAssignMode] = useState<AssignMode>('checklist');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch unassigned tasks and checklist items
  const { data: tasks = [], isLoading: tasksLoading } = useUnassignedTasks(projectId);
  const { data: checklistItems = [], isLoading: checklistLoading } = useUnassignedChecklistItems(projectId);
  
  const currentItems = assignMode === 'tasks' ? tasks : checklistItems;
  const isLoading = assignMode === 'tasks' ? tasksLoading : checklistLoading;

  // Fetch project workers
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: async () => {
      if (projectId) {
        // If projectId is provided, get workers for that specific project
        const { data: roleData, error: roleError } = await supabase
          .from('user_project_role')
          .select('user_id')
          .eq('project_id', projectId);

        if (roleError) throw roleError;
        
        const userIds = roleData.map(r => r.user_id);
        if (userIds.length === 0) return [];

        // Then get profile data for those users
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url, role')
          .in('user_id', userIds);

        if (error) throw error;
        return data.map(profile => ({
          id: profile.user_id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          role: profile.role
        }));
      } else {
        // If no projectId, get all workers and managers
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url, role')
          .in('role', ['worker', 'manager']);

        if (error) throw error;
        return data.map(profile => ({
          id: profile.user_id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          role: profile.role
        }));
      }
    },
    enabled: open
  });

  const bulkAssignMutation = useBulkAssign();
  const bulkAssignChecklistMutation = useBulkAssignChecklistItems();

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return workers;
    return workers.filter(worker => 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workers, searchQuery]);

  const handleItemToggle = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(new Set(currentItems.map(item => item.id)));
  }, [currentItems]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleModeChange = useCallback((mode: AssignMode) => {
    setAssignMode(mode);
    setSelectedItems(new Set());
    setSelectedWorker(null);
  }, []);

  const handleAssign = async () => {
    if (!selectedWorker || selectedItems.size === 0) {
      toast({
        title: "Selection Required",
        description: `Please select ${assignMode === 'tasks' ? 'tasks' : 'checklist items'} and a worker to assign them to.`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (assignMode === 'tasks') {
        const assignments = Array.from(selectedItems).map(taskId => ({
          taskId,
          userIds: [selectedWorker.id],
          primaryId: selectedWorker.id
        }));

        await bulkAssignMutation.mutateAsync({ assignments });
      } else {
        // Group items by project checklist ID
        const checklistAssignments = Array.from(selectedItems).map(itemId => {
          const item = checklistItems.find(ci => ci.id === itemId);
          if (!item) throw new Error(`Checklist item ${itemId} not found`);
          
          return {
            projectChecklistId: item.projectChecklistId,
            itemId: itemId,
            userId: selectedWorker.id
          };
        });

        await bulkAssignChecklistMutation.mutateAsync({ assignments: checklistAssignments });
      }

      const itemType = assignMode === 'tasks' ? 'tasks' : 'checklist items';
      toast({
        title: `${assignMode === 'tasks' ? 'Tasks' : 'Checklist Items'} Assigned`,
        description: `Successfully assigned ${selectedItems.size} ${itemType} to ${selectedWorker.name}`,
      });

      setSelectedItems(new Set());
      setSelectedWorker(null);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: `Failed to assign ${assignMode === 'tasks' ? 'tasks' : 'checklist items'}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const itemRowData = useMemo(() => ({
    items: currentItems,
    selectedItems,
    onItemToggle: handleItemToggle,
    isMobile
  }), [currentItems, selectedItems, handleItemToggle, isMobile]);

  const MainContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5" />
          <h2 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
            Quick Assign {assignMode === 'tasks' ? 'Tasks' : 'Checklist Items'}
          </h2>
        </div>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
          Bulk assign unassigned {assignMode === 'tasks' ? 'tasks' : 'checklist items'} to workers efficiently
        </p>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={assignMode === 'checklist' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('checklist')}
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Checklist Items ({checklistItems.length})
          </Button>
          <Button
            variant={assignMode === 'tasks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('tasks')}
            className="gap-2"
          >
            <ListTodo className="h-4 w-4" />
            Tasks ({tasks.length})
          </Button>
        </div>
      </div>

      {/* Search Worker - Sticky on mobile */}
      <div className={`flex-shrink-0 mb-4 ${isMobile ? 'sticky top-0 bg-background z-10 pb-2' : ''}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search workers..."
            className={`pl-10 ${isMobile ? 'h-12 text-base' : ''}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={`grid gap-6 flex-1 overflow-hidden ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
              Unassigned {assignMode === 'tasks' ? 'Tasks' : 'Checklist Items'}
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size={isMobile ? 'sm' : 'sm'}
                onClick={handleSelectAll}
                disabled={currentItems.length === 0}
                className={isMobile ? 'h-9 px-3 text-sm' : ''}
              >
                All
              </Button>
              <Button 
                variant="outline" 
                size={isMobile ? 'sm' : 'sm'}
                onClick={handleDeselectAll}
                disabled={selectedItems.size === 0}
                className={isMobile ? 'h-9 px-3 text-sm' : ''}
              >
                Clear
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`bg-muted rounded-lg animate-pulse ${isMobile ? 'h-16' : 'h-14'}`} />
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
                All {assignMode === 'tasks' ? 'Tasks' : 'Checklist Items'} Assigned
              </h4>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                No unassigned {assignMode === 'tasks' ? 'tasks' : 'checklist items'} found for this project.
              </p>
            </div>
          ) : (
          <List
            height={isMobile ? 350 : 400}
            width="100%"
            itemCount={currentItems.length}
            itemSize={isMobile ? 80 : 70}
            itemData={itemRowData}
          >
            {ItemRow}
          </List>
          )}

          {selectedItems.size > 0 && (
            <div className="bg-primary/10 p-3 rounded-lg">
              <p className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                {selectedItems.size} {assignMode === 'tasks' ? 'task' : 'item'}{selectedItems.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {!isMobile && <Separator orientation="vertical" className="hidden lg:block" />}

        {/* Workers Section */}
        <div className="space-y-4">
          <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
            Select Worker
          </h3>

          <ScrollArea className={`flex-1 ${isMobile ? 'max-h-[250px]' : 'max-h-[400px]'}`}>
            {workersLoading ? (
              <div className="space-y-3 p-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3">
                    <div className={`bg-muted rounded-full animate-pulse ${isMobile ? 'h-12 w-12' : 'h-10 w-10'}`} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No workers found</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {filteredWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors touch-manipulation ${
                      selectedWorker?.id === worker.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted/50'
                    } ${isMobile ? 'min-h-[64px]' : ''}`}
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <Avatar className={isMobile ? 'h-12 w-12' : 'h-10 w-10'}>
                      <AvatarImage src={worker.avatar_url || ''} />
                      <AvatarFallback>
                        {worker.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
                        {worker.name}
                      </p>
                      <p className={`text-muted-foreground capitalize ${isMobile ? 'text-sm' : 'text-xs'}`}>
                        {worker.role}
                      </p>
                    </div>
                    {selectedWorker?.id === worker.id && (
                      <CheckSquare className={`text-primary ${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedWorker && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className={isMobile ? 'text-sm' : 'text-sm'}>
                <span className="font-medium">Selected:</span> {selectedWorker.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-3 pt-4 border-t flex-shrink-0 ${isMobile ? 'flex-col' : 'justify-end'}`}>
        <Button 
          variant="outline" 
          onClick={() => setOpen(false)}
          className={isMobile ? 'h-12' : ''}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleAssign}
          disabled={selectedItems.size === 0 || !selectedWorker || bulkAssignMutation.isPending || bulkAssignChecklistMutation.isPending}
          className={isMobile ? 'h-12' : 'min-w-24'}
        >
          {(bulkAssignMutation.isPending || bulkAssignChecklistMutation.isPending) ? (
            <>Assigning...</>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return isMobile ? (
    <BottomSheet open={open} onOpenChange={setOpen} trigger={children}>
      <MainContent />
    </BottomSheet>
  ) : (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-4xl flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Assign {assignMode === 'tasks' ? 'Tasks' : 'Checklist Items'}
          </SheetTitle>
          <SheetDescription>
            Bulk assign unassigned {assignMode === 'tasks' ? 'tasks' : 'checklist items'} to workers efficiently
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 flex-1 overflow-hidden">
          <MainContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}