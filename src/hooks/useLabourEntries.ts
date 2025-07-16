import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type LabourEntry = Tables<'labour_entries'> & {
  profiles?: { name: string };
  project_phases?: { name: string };
};

export type CreateLabourEntry = Omit<TablesInsert<'labour_entries'>, 'user_id'>;
export type UpdateLabourEntry = TablesUpdate<'labour_entries'>;

export function useLabourEntries(projectId: string) {
  const [entries, setEntries] = useState<LabourEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (projectId) {
      fetchEntries();
    }
  }, [projectId]);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('labour_entries')
        .select(`
          *,
          profiles!labour_entries_user_id_fkey(name),
          project_phases(name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching labour entries:', error);
      toast({
        title: "Error",
        description: "Failed to load labour entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createEntry = async (entry: CreateLabourEntry) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create labour entries",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('labour_entries')
        .insert({
          ...entry,
          user_id: user.id
        })
        .select(`
          *,
          profiles!labour_entries_user_id_fkey(name),
          project_phases(name)
        `)
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Labour entry created successfully",
      });
      return data;
    } catch (error) {
      console.error('Error creating labour entry:', error);
      toast({
        title: "Error",
        description: "Failed to create labour entry",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEntry = async (id: string, updates: UpdateLabourEntry) => {
    try {
      const { data, error } = await supabase
        .from('labour_entries')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          profiles!labour_entries_user_id_fkey(name),
          project_phases(name)
        `)
        .single();

      if (error) throw error;

      setEntries(prev => prev.map(entry => 
        entry.id === id ? data : entry
      ));

      toast({
        title: "Success",
        description: "Labour entry updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating labour entry:', error);
      toast({
        title: "Error",
        description: "Failed to update labour entry",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('labour_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast({
        title: "Success",
        description: "Labour entry deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting labour entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete labour entry",
        variant: "destructive",
      });
    }
  };

  const startTimer = async (taskDescription: string, phaseId?: string, hourlyRate: number = 0) => {
    return await createEntry({
      project_id: projectId,
      phase_id: phaseId || null,
      task_description: taskDescription,
      start_time: new Date().toISOString(),
      hourly_rate: hourlyRate,
      status: 'active'
    });
  };

  const stopTimer = async (id: string) => {
    return await updateEntry(id, {
      end_time: new Date().toISOString(),
      status: 'completed'
    });
  };

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    startTimer,
    stopTimer,
    refetch: fetchEntries
  };
}