import { useState, useEffect, useMemo } from 'react';
import { Search, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUnassignedWorkers, useUpdateWorkerAssignment } from '@/hooks/schedule';

interface WorkerSelectSheetProps {
  scheduleItemId: string;
  scheduleDate: Date;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function WorkerSelectSheet({ 
  scheduleItemId, 
  scheduleDate,
  trigger,
  children 
}: WorkerSelectSheetProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const { data: unassignedWorkers = [] } = useUnassignedWorkers(scheduleDate);
  const updateWorkerAssignment = useUpdateWorkerAssignment();

  // Filter workers based on search query
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return unassignedWorkers;
    
    return unassignedWorkers.filter(worker => 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unassignedWorkers, searchQuery]);

  const handleWorkerSelect = async (worker: any) => {
    try {
      await updateWorkerAssignment.mutateAsync({
        scheduleItemId,
        userId: worker.user_id,
        isAssistant: false,
        action: 'assign'
      });

      toast({
        title: "Worker assigned",
        description: `${worker.name} has been assigned to this schedule item.`
      });

      setOpen(false);
      setSearchQuery('');
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: "Failed to assign worker. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Reset search when sheet closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full min-h-12 text-sm">
            <Users className="h-4 w-4 mr-2" />
            📱 Assign Worker
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Worker
          </SheetTitle>
        </SheetHeader>

        {/* Search Input */}
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Workers List */}
        <div className="flex-1 overflow-y-auto space-y-2">
        {filteredWorkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">
                {searchQuery ? 'No workers found' : '⚠️ No workers available'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? `No workers match "${searchQuery}"`
                  : 'All workers are currently assigned'
                }
              </p>
            </div>
          ) : (
            filteredWorkers.map((worker) => {
              const displayName = worker.name;
              
              return (
                <div
                  key={worker.user_id}
                  onClick={() => handleWorkerSelect(worker)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors min-h-16"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {displayName?.charAt(0)?.toUpperCase() || '👤'}
                    </div>
                    <div>
                      <div className="font-medium">{displayName}</div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="opacity-60"
                  >
                    Assign
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {children}
      </SheetContent>
    </Sheet>
  );
}