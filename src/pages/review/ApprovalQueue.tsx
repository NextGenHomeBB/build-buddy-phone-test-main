import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { CheckCircle, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  project: { name: string } | null;
  phase: { name: string } | null;
}

export default function ApprovalQueue() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Fetch tasks awaiting approval
  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['approval-queue', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          approved_at,
          project:projects(name),
          phase:project_phases(name)
        `)
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .is('approved_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId
  });

  const handleApprovalSuccess = () => {
    setSelectedTask(null);
    refetch();
    toast({
      title: "Task Approved",
      description: "The task has been successfully approved with your signature.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Task Approval Queue
          </h1>
          <p className="text-muted-foreground">
            Review and approve completed tasks with your digital signature
          </p>
        </div>

        {!tasks || tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Tasks Pending Approval
              </h3>
              <p className="text-muted-foreground text-center">
                All completed tasks have been approved. Great work!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Awaiting Approval
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {task.description && (
                      <p className="text-muted-foreground">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium">Project:</span>{' '}
                        {task.project?.name}
                      </div>
                      {task.phase && (
                        <div>
                          <span className="font-medium">Phase:</span>{' '}
                          {task.phase.name}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Completed:</span>{' '}
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>


                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={() => setSelectedTask(task.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve with Signature
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTask && (
          <SignatureDialog
            taskId={selectedTask}
            open={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onSuccess={handleApprovalSuccess}
          />
        )}
      </div>
    </div>
  );
}