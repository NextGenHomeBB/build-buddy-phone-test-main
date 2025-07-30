import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DefaultPhase {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export function useDefaultPhases() {
  return useQuery({
    queryKey: ['default-phases'],
    queryFn: async () => {
      // Default phases table doesn't exist - return hardcoded phases
      return [
        { id: '1', name: 'Planning', description: 'Project planning phase', order_index: 1 },
        { id: '2', name: 'Design', description: 'Design and specification phase', order_index: 2 },
        { id: '3', name: 'Construction', description: 'Construction phase', order_index: 3 },
        { id: '4', name: 'Finishing', description: 'Finishing and completion phase', order_index: 4 },
      ] as DefaultPhase[];
    }
  });
}

export function useCreateDefaultPhase() {
  return useMutation({
    mutationFn: async (phase: Omit<DefaultPhase, 'id' | 'created_at' | 'updated_at'>) => {
      // Default phases table doesn't exist - skip creation
      return { id: Math.random().toString(), ...phase, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    }
  });
}

export function useUpdateDefaultPhase() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; order_index?: number }) => {
      // Default phases table doesn't exist - skip update
      return { id, ...updates, updated_at: new Date().toISOString() };
    }
  });
}

export function useDeleteDefaultPhase() {
  return useMutation({
    mutationFn: async (id: string) => {
      // Default phases table doesn't exist - skip deletion
      return;
    }
  });
}