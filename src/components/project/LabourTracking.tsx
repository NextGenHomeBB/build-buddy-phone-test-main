import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Square, 
  Clock, 
  DollarSign, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Timer,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';
import { useLabourEntries, LabourEntry } from '@/hooks/useLabourEntries';
import { useProjectPhases } from '@/hooks/useProjects';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useToast } from '@/hooks/use-toast';

interface LabourTrackingProps {
  projectId: string;
}

export function LabourTracking({ projectId }: LabourTrackingProps) {
  const { entries, isLoading, startTimer, stopTimer, updateEntry, deleteEntry } = useLabourEntries(projectId);
  const { data: phases } = useProjectPhases(projectId);
  const { canEditProject } = useRoleAccess();
  const { toast } = useToast();
  
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LabourEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    task_description: '',
    phase_id: '',
    hourly_rate: 0,
    notes: ''
  });

  const activeEntries = entries.filter(entry => entry.status === 'active');
  const completedEntries = entries.filter(entry => entry.status === 'completed');

  const totalHours = completedEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
  const totalCost = completedEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);

  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleStartTimer = async () => {
    if (!newEntry.task_description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task description",
        variant: "destructive",
      });
      return;
    }

    await startTimer(
      newEntry.task_description,
      newEntry.phase_id || undefined,
      newEntry.hourly_rate
    );

    setNewEntry({ task_description: '', phase_id: '', hourly_rate: 0, notes: '' });
    setShowNewEntryDialog(false);
  };

  const handleStopTimer = async (entryId: string) => {
    await stopTimer(entryId);
  };

  const handleEditEntry = async (entry: LabourEntry, updates: Partial<LabourEntry>) => {
    await updateEntry(entry.id, updates);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this labour entry?')) {
      await deleteEntry(entryId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Clock className="h-4 w-4 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
                <div className="text-xl font-semibold">{totalHours.toFixed(1)}h</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-xl font-semibold">${totalCost.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Timer className="h-4 w-4 text-warning" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Timers</div>
                <div className="text-xl font-semibold">{activeEntries.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Timers */}
      {activeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Active Timers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{entry.task_description}</div>
                  <div className="text-sm text-muted-foreground">
                    Started {formatDistanceToNow(new Date(entry.start_time))} ago
                    {entry.project_phases?.name && ` • ${entry.project_phases.name}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono font-semibold">
                      {formatDuration(entry.start_time)}
                    </div>
                    {entry.hourly_rate > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ${entry.hourly_rate}/hr
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStopTimer(entry.id)}
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions and History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Labour History</CardTitle>
              <CardDescription>Track time and costs for project tasks</CardDescription>
            </div>
            <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Timer</DialogTitle>
                  <DialogDescription>
                    Begin tracking time for a task
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task">Task Description</Label>
                    <Input
                      id="task"
                      value={newEntry.task_description}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, task_description: e.target.value }))}
                      placeholder="What are you working on?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phase">Phase (Optional)</Label>
                    <Select 
                      value={newEntry.phase_id} 
                      onValueChange={(value) => setNewEntry(prev => ({ ...prev, phase_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {phases?.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rate">Hourly Rate</Label>
                    <Input
                      id="rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newEntry.hourly_rate}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewEntryDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStartTimer}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {completedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No labour entries yet. Start tracking your work!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="font-medium">{entry.task_description}</div>
                      {entry.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{entry.notes}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {entry.profiles?.name || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.project_phases?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.start_time), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-mono">
                      {entry.total_hours?.toFixed(2)}h
                    </TableCell>
                    <TableCell>
                      ${entry.hourly_rate?.toFixed(2)}/hr
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${entry.total_cost?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'completed' ? 'default' : 'secondary'}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEditProject() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}