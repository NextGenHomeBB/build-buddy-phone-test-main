import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

interface WorkerSelectProps {
  projectId: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
}

export function WorkerSelect({ projectId, value, onValueChange, placeholder = "Select worker..." }: WorkerSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch project workers
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get workers for the specific project
      const { data: roleData, error: roleError } = await supabase
        .from('user_project_role')
        .select('user_id')
        .eq('project_id', projectId);

      if (roleError) throw roleError;
      
      const userIds = roleData.map(r => r.user_id);
      if (userIds.length === 0) return [];

      // Get profile data for those users
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, role')
        .in('user_id', userIds)
        .in('role', ['worker', 'manager']);

      if (error) throw error;
      return data.map(profile => ({
        id: profile.user_id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        role: profile.role
      })) as Worker[];
    },
    enabled: !!projectId,
  });

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return workers;
    return workers.filter(worker => 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workers, searchQuery]);

  const selectedWorker = workers.find(w => w.id === value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search workers..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger className="w-full h-12">
          <SelectValue placeholder={placeholder}>
            {selectedWorker && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedWorker.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {selectedWorker.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedWorker.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  ({selectedWorker.role})
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Loading workers...
            </SelectItem>
          ) : filteredWorkers.length === 0 ? (
            <SelectItem value="no-workers" disabled>
              No workers found
            </SelectItem>
          ) : (
            filteredWorkers.map((worker) => (
              <SelectItem key={worker.id} value={worker.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={worker.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {worker.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{worker.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    ({worker.role})
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}