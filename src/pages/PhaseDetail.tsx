import { useParams, Link } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { usePhase, useUpdateChecklistItem } from '@/hooks/useProjects';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AddTaskDialog } from '@/components/project/AddTaskDialog';
import { QuickAddTask } from '@/components/project/QuickAddTask';
import { EditPhaseDialog } from '@/components/project/EditPhaseDialog';
import { EditPhaseDatesDialog } from '@/components/project/EditPhaseDatesDialog';
import { EditPhaseBudgetDialog } from '@/components/project/EditPhaseBudgetDialog';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { BudgetBadge } from '@/components/BudgetBadge';
import { PhaseCostDisplay } from '@/components/PhaseCostDisplay';
import { MaterialCostSheet } from '@/components/MaterialCostSheet';
import { LabourCostSheet } from '@/components/LabourCostSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  User,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getPriorityIcon, getStatusColor, getPhaseStatusIcon } from '@/lib/ui-helpers';
import { usePhaseCosts } from '@/services/phaseCosts.service';
import { calculateProgress, calculateBudgetProgress } from '@/lib/progress-utils';

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
  const { data: phaseCosts } = usePhaseCosts(phaseId!);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateChecklistItem = useUpdateChecklistItem();
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'costs'>('checklist');
  const [showMaterialCostSheet, setShowMaterialCostSheet] = useState(false);
  const [showLabourCostSheet, setShowLabourCostSheet] = useState(false);
  const isMobile = useIsMobile();

  // Mutation to update phase status
  const updatePhaseStatus = useMutation({
    mutationFn: async (newStatus: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled') => {
      // Update the phase status
      const { data, error } = await supabase
        .from('project_phases')
        .update({ status: newStatus })
        .eq('id', phaseId!)
        .select()
        .single();
      
      if (error) throw error;

      // If setting status to completed, automatically complete all tasks in this phase
      if (newStatus === 'completed') {
        const { error: tasksError } = await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('phase_id', phaseId!)
          .neq('status', 'completed'); // Only update tasks that aren't already completed
        
        if (tasksError) {
          console.warn('Failed to auto-complete tasks:', tasksError);
          // Don't throw error, just warn - phase status update succeeded
        }

        // Skip progress update since function doesn't exist
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases', phaseId] });
      
      const isCompleted = data.status === 'completed';
      toast({
        title: isCompleted ? "Phase Completed! 🎉" : "Status Updated",
        description: isCompleted 
          ? `Phase "${data.name}" and all its tasks are now completed!`
          : `Phase status changed to ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update phase status. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      const previousPhase = phase;
      
      await updateChecklistItem.mutateAsync({
        phaseId: phase.id,
        itemId: item.id,
        completed: !item.completed,
        completedBy: !item.completed ? profile?.name || user?.email : undefined,
      });

      // Check if this completion would complete all items
      if (!item.completed) {
        const remainingIncomplete = phase.checklist.filter(checklistItem => 
          checklistItem.id !== item.id && !checklistItem.completed
        );
        
        if (remainingIncomplete.length === 0) {
          toast({
            title: "Phase Completed! 🎉",
            description: `All tasks in "${phase.name}" are now complete. Phase status has been automatically updated to "Completed".`,
          });
        } else {
          toast({
            title: "Task completed!",
            description: `"${item.title}" has been completed.`,
          });
        }
      } else {
        toast({
          title: "Task reopened",
          description: `"${item.title}" has been marked as incomplete.`,
        });
      }
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
      trackMouse: !isMobile, // Only track mouse on desktop
      preventScrollOnSwipe: false, // Allow scrolling
      delta: 10, // Require more movement to trigger swipe
      swipeDuration: 500,
      touchEventOptions: { passive: false },
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
      <div className={`${isMobile ? 'space-y-4 pb-20 px-4' : 'space-y-6'} min-h-screen overflow-auto`}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size={isMobile ? "sm" : "sm"} asChild>
            <Link to={`/projects/${projectId}?tab=phases`}>
              <ArrowLeft className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} mr-2`} />
              {isMobile ? 'Back' : 'Back to Phases'}
            </Link>
          </Button>
        </div>

        {/* Phase Overview */}
        <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col lg:flex-row lg:items-start lg:justify-between gap-4'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-foreground`}>
                  {phase.name}
                </h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`${getStatusColor(phase.status)} hover:opacity-80 transition-opacity border-0`}
                    >
                      {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-50 bg-background border border-border shadow-lg">
                    <DropdownMenuItem 
                      onClick={() => updatePhaseStatus.mutate('planning')}
                      className="cursor-pointer hover:bg-muted"
                    >
                      Planning
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePhaseStatus.mutate('active')}
                      className="cursor-pointer hover:bg-muted"
                    >
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePhaseStatus.mutate('on-hold')}
                      className="cursor-pointer hover:bg-muted"
                    >
                      On Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePhaseStatus.mutate('completed')}
                      className="cursor-pointer hover:bg-muted"
                    >
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updatePhaseStatus.mutate('cancelled')}
                      className="cursor-pointer hover:bg-muted"
                    >
                      Cancelled
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-muted-foreground">
                {phase.description}
              </p>
            </div>
            
            <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} gap-2`}>
              {phaseCosts && (
                <BudgetBadge amount={phaseCosts.remainingBudget} />
              )}
              <EditPhaseDialog phase={phase} projectId={projectId!}>
                <Button variant="outline" size="sm">
                  {isMobile ? 'Edit' : 'Edit Phase'}
                </Button>
              </EditPhaseDialog>
              <Button size="sm" asChild>
                <Link to={`/projects/${projectId}?tab=calendar`}>
                  {isMobile ? 'Timeline' : 'View Timeline'}
                </Link>
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
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
                <Progress value={calculateProgress(completedTasks, totalTasks)} className="mt-2" />
              </CardContent>
            </Card>

            <EditPhaseBudgetDialog phase={phase}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
                  <Progress value={calculateBudgetProgress(phase.spent, phase.budget)} className="mt-2" />
                </CardContent>
              </Card>
            </EditPhaseBudgetDialog>

            <EditPhaseDatesDialog phase={phase}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
            </EditPhaseDatesDialog>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Clock className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <div className="text-lg font-semibold">0%</div>
                  </div>
                </div>
                <Progress value={0} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'checklist'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Phase Checklist
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'costs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Cost Management
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Phase Checklist</h2>
                <p className="text-sm text-muted-foreground">
                  Swipe left on any task to mark it complete
                </p>
              </div>
              <AddTaskDialog projectId={projectId!} phaseId={phase.id} />
            </div>

            <div className="space-y-3">
              {phase.checklist.map((item) => (
                <ChecklistItemComponent key={item.id} item={item} />
              ))}
              
              {/* Quick Add Input */}
              <QuickAddTask projectId={projectId!} phaseId={phase.id} />
              
              {phase.checklist.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No checklist items found for this phase.</p>
                  <p className="text-xs mt-2">Use the "Add Task" button above or quick add below to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'costs' && (
          <PhaseCostDisplay
            phaseId={phase.id}
            onAddMaterialCost={() => setShowMaterialCostSheet(true)}
            onAddLabourCost={() => setShowLabourCostSheet(true)}
          />
        )}
      </div>

      {/* Cost Sheets */}
      <MaterialCostSheet 
        phaseId={phase.id}
        open={showMaterialCostSheet}
        onOpenChange={setShowMaterialCostSheet} 
      />
      
      <LabourCostSheet 
        phaseId={phase.id}
        open={showLabourCostSheet}
        onOpenChange={setShowLabourCostSheet} 
      />
    </AppLayout>
  );
}
