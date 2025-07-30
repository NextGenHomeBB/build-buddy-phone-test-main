import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  project_id?: string;
  phase_id?: string;
}

export function useChecklists() {
  return useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Checklist[];
    }
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (checklist: {
      name: string;
      description?: string;
      items: { id: string; title: string; description?: string }[];
    }) => {
      // First create the checklist (without items since they're stored separately)
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists')
        .insert({
          name: checklist.name,
          description: checklist.description,
          organization_id: '00000000-0000-0000-0000-000000000000', // Default org
        })
        .select()
        .single();
      
      if (checklistError) throw checklistError;

      // Then create the checklist items separately
      if (checklist.items.length > 0) {
        const items = checklist.items.map(item => ({
          checklist_id: checklistData.id,
          title: item.title,
          description: item.description,
          organization_id: '00000000-0000-0000-0000-000000000000',
          is_done: false,
          is_completed: false
        }));

        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(items);
        
        if (itemsError) throw itemsError;
      }

      return checklistData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Checklist created",
        description: "The checklist has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create checklist: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}

export function useUpdateChecklist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('checklists')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Checklist updated",
        description: "The checklist has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update checklist: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete related checklist items
      const { error: itemsError } = await supabase
        .from('checklist_items')
        .delete()
        .eq('checklist_id', id);
      
      if (itemsError) throw itemsError;

      // Then delete the checklist
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Checklist deleted",
        description: "The checklist has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete checklist: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}