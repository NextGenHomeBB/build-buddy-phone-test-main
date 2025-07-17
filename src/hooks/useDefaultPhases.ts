import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DefaultPhase {
  id: string;
  name: string;
  checklist: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useDefaultPhases() {
  return useQuery({
    queryKey: ['default-phases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('default_phases')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as DefaultPhase[];
    },
  });
}

export function useUpdateDefaultPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: { name: string; checklist: string[] } 
    }) => {
      const { data, error } = await supabase
        .from('default_phases')
        .update({
          name: updates.name,
          checklist: updates.checklist,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-phases'] });
      // Also invalidate any project phase queries to show the updates
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Success",
        description: "Default phase updated successfully. New tasks have been created in all existing project phases with the same name.",
      });
    },
    onError: (error) => {
      console.error('Error updating default phase:', error);
      toast({
        title: "Error",
        description: "Failed to update default phase",
        variant: "destructive",
      });
    },
  });
}

export function useCreateDefaultPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phase: { 
      name: string; 
      checklist: string[]; 
      display_order: number 
    }) => {
      const { data, error } = await supabase
        .from('default_phases')
        .insert({
          name: phase.name,
          checklist: phase.checklist,
          display_order: phase.display_order,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-phases'] });
      toast({
        title: "Success",
        description: "Default phase created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating default phase:', error);
      toast({
        title: "Error",
        description: "Failed to create default phase",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDefaultPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('default_phases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-phases'] });
      toast({
        title: "Success",
        description: "Default phase deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting default phase:', error);
      toast({
        title: "Error",
        description: "Failed to delete default phase",
        variant: "destructive",
      });
    },
  });
}