import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Users, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssignableItem {
  id: string;
  title: string;
  description?: string;
  projectName: string;
  checklistName?: string;
  type: 'task' | 'checklist';
}

interface Worker {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  skills?: string[];
  currentTasks: number;
  availability: 'available' | 'busy' | 'offline';
}

interface Assignment {
  itemId: string;
  workerId: string;
  deadline?: Date;
}

export function WorkerTaskAssignment() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const { toast } = useToast();

  // Fetch workers
  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin');

      if (error) throw error;
      
      return data.map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.name || 'Unknown',
        role: profile.role || 'Worker',
        avatar: profile.avatar_url,
        skills: [],
        currentTasks: 0,
        availability: 'available' as const,
      }));
    },
  });

  // Fetch projects for context
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['unassigned-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('assigned_to', null);

      if (error) throw error;
      return data;
    },
  });

  // Fetch checklists (disabled since items column doesn't exist)
  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  // Transform tasks to assignable items
  const assignableTaskItems: AssignableItem[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    projectName: projects.find(p => p.id === task.project_id)?.name || 'Unknown Project',
    type: 'task' as const,
  }));

  // Transform checklist items to assignable items (disabled since items column doesn't exist)
  const assignableChecklistItems: AssignableItem[] = [];

  const allAssignableItems = [...assignableTaskItems, ...assignableChecklistItems];

  const filteredItems = allAssignableItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAssign = async () => {
    if (!selectedWorker || selectedItems.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select both items and a worker to assign.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update tasks to assign them to the worker
      const taskIds = selectedItems.filter(id => 
        assignableTaskItems.some(item => item.id === id)
      );

      if (taskIds.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .update({ assigned_to: selectedWorker })
          .in('id', taskIds);

        if (error) throw error;
      }

      // Create assignments record
      const newAssignments = selectedItems.map(itemId => ({
        itemId,
        workerId: selectedWorker,
        deadline: undefined,
      }));

      setAssignments(prev => [...prev, ...newAssignments]);
      setSelectedItems([]);
      setSelectedWorker(null);

      toast({
        title: 'Assignment Successful',
        description: `${selectedItems.length} items assigned successfully.`,
      });

    } catch (error) {
      console.error('Assignment error:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign items to worker.',
        variant: 'destructive',
      });
    }
  };

  const getWorkerColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items to Assign */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Available Items ({filteredItems.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks and checklists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedItems.includes(item.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleItemSelect(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        <Badge variant="outline" className="shrink-0">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.projectName}
                        </span>
                        {item.checklistName && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {item.checklistName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items available for assignment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workers */}
        <Card className="lg:w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workers ({workers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWorker === worker.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedWorker(worker.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {worker.avatar ? (
                        <img
                          src={worker.avatar}
                          alt={worker.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {worker.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">{worker.name}</h4>
                        <Badge className={getWorkerColor(worker.availability)}>
                          {worker.availability}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{worker.role}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {worker.currentTasks} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {workers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No workers available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedItems.length} item(s) selected
              {selectedWorker && (
                <span className="ml-2">
                  → {workers.find(w => w.id === selectedWorker)?.name}
                </span>
              )}
            </div>
            <Button
              onClick={handleAssign}
              disabled={!selectedWorker || selectedItems.length === 0}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Assign Selected Items
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}