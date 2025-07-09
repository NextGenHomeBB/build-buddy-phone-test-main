import { useParams, Link } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { usePhase, useUpdateChecklistItem } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  User,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getPriorityIcon, getStatusColor, getPhaseStatusIcon } from '@/lib/ui-helpers';

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  estimatedHours?: number;
}

export default function PhaseDetail() {
  const { id: projectId, phaseId } = useParams<{ id: string; phaseId: string }>();
  const { data: phase, isLoading } = usePhase(phaseId!);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const updateChecklistItem = useUpdateChecklistItem();
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!phase) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">Phase not found</h2>
            <Button asChild className="mt-4">
              <Link to={`/projects/${projectId}`}>Back to Project</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'blocked': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };


  const handleToggleItem = async (item: ChecklistItem) => {
    if (!user) return;

    try {
      await updateChecklistItem.mutateAsync({
        phaseId: phase.id,
        itemId: item.id,
        completed: !item.completed,
        completedBy: !item.completed ? profile?.name || user?.email : undefined,
      });

      toast({
        title: item.completed ? "Task reopened" : "Task completed!",
        description: item.completed 
          ? `"${item.title}" has been marked as incomplete.`
          : `"${item.title}" has been completed.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ChecklistItemComponent = ({ item }: { item: ChecklistItem }) => {
    const handlers = useSwipeable({
      onSwipedLeft: () => {
        if (!item.completed) {
          handleToggleItem(item);
        }
      },
      onSwiping: (eventData) => {
        if (eventData.dir === 'Left' && !item.completed) {
          setSwipingItemId(item.id);
        }
      },
      onSwiped: () => {
        setSwipingItemId(null);
      },
      trackMouse: true,
      preventScrollOnSwipe: true,
    });

    const isSwipping = swipingItemId === item.id;

    return (
      <div 
        {...handlers}
        className={`relative overflow-hidden transition-transform duration-200 ${
          isSwipping ? 'transform -translate-x-2' : ''
        }`}
      >
        <Card className={`transition-all duration-200 ${
          item.completed ? 'opacity-60' : 'hover:shadow-md'
        } ${isSwipping ? 'bg-success/10 border-success' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleToggleItem(item)}
                className="mt-1 flex-shrink-0"
              >
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className={`font-medium ${
                      item.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(() => {
                        const Icon = getPriorityIcon(item.priority);
                        return <Icon className="h-3 w-3" />;
                      })()}
                      <span className="text-xs font-medium capitalize">
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-muted/50 rounded-full">
                    {item.category}
                  </span>
                  
                  {item.estimatedHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.estimatedHours}h
                    </span>
                  )}
                  
                  {item.completed && item.completedBy && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.completedBy}
                    </span>
                  )}
                  
                  {item.completed && item.completedAt && (
                    <span>
                      {format(new Date(item.completedAt), 'MMM dd, HH:mm')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swipe hint for incomplete items */}
        {!item.completed && (
          <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 ${
            isSwipping ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center gap-2 text-success">
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const completedTasks = phase.checklist.filter(item => item.completed).length;
  const totalTasks = phase.checklist.length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Link>
          </Button>
        </div>

        {/* Phase Overview */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {phase.name}
                </h1>
                <Badge className={getStatusColor(phase.status)}>
                  {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {phase.description}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit Phase
              </Button>
              <Button size="sm">
                View Timeline
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tasks</div>
                    <div className="text-lg font-semibold">{completedTasks} / {totalTasks}</div>
                  </div>
                </div>
                <Progress value={(completedTasks / totalTasks) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Budget</div>
                    <div className="text-lg font-semibold">
                      ${(phase.spent / 1000).toFixed(0)}k / ${(phase.budget / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
                <Progress value={(phase.spent / phase.budget) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Calendar className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Timeline</div>
                    <div className="text-sm font-medium">
                      {format(new Date(phase.startDate), 'MMM dd')} - {format(new Date(phase.endDate), 'MMM dd')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Clock className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <div className="text-lg font-semibold">{phase.progress}%</div>
                  </div>
                </div>
                <Progress value={phase.progress} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Phase Checklist</h2>
              <p className="text-sm text-muted-foreground">
                Swipe left on any task to mark it complete
              </p>
            </div>
            <Button size="sm">Add Task</Button>
          </div>

          <div className="space-y-3">
            {phase.checklist.map((item) => (
              <ChecklistItemComponent key={item.id} item={item} />
            ))}
            
            {phase.checklist.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No checklist items found for this phase.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}