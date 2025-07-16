import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Zap, Clock, Building, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface QuickTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  due_date: string | null;
  project_name: string | null;
  phase_name: string | null;
  assigned_by_user_name: string | null;
}

interface WorkerQuickTasksProps {
  children: React.ReactNode;
}

export function WorkerQuickTasks({ children }: WorkerQuickTasksProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { data: quickTasks = [], isLoading } = useQuery({
    queryKey: ['worker-quick-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching quick tasks:', error);
        throw error;
      }

      return data as QuickTask[];
    },
    enabled: open,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'review': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const MainContent = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Quick Assigned Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Tasks quickly assigned to you by admins and managers
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : quickTasks.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Quick Tasks</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any quick assigned tasks yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {quickTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium flex-1">
                      {task.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusIcon(task.status)}
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {task.project_name && (
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>{task.project_name}</span>
                        {task.phase_name && (
                          <span className="text-muted-foreground">
                            • {task.phase_name}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {task.assigned_by_user_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Assigned by {task.assigned_by_user_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Created {format(new Date(task.created_at), 'MMM d, yyyy')}
                      </span>
                      {task.due_date && (
                        <span className="text-orange-600">
                          • Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={setOpen} trigger={children}>
        <MainContent />
      </BottomSheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Quick Assigned Tasks</SheetTitle>
          <SheetDescription>
            View tasks that have been quickly assigned to you
          </SheetDescription>
        </SheetHeader>
        <MainContent />
      </SheetContent>
    </Sheet>
  );
}