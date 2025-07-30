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
          *
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected interface
      const transformedData = (data || []).map(entry => ({
        ...entry,
        profiles: { name: 'Unknown User' },
        project_phases: { name: 'Unknown Phase' }
      }));
      
      setEntries(transformedData);
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
        .select()
        .single();

      if (error) throw error;

      // Transform to match expected interface  
      const transformedData = {
        ...data,
        profiles: { name: 'Unknown User' },
        project_phases: { name: 'Unknown Phase' }
      };

      setEntries(prev => [transformedData, ...prev]);
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
        .select()
        .single();

      if (error) throw error;

      // Transform to match expected interface
      const transformedData = {
        ...data,
        profiles: { name: 'Unknown User' },
        project_phases: { name: 'Unknown Phase' }
      };

      setEntries(prev => prev.map(entry => 
        entry.id === id ? transformedData : entry
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
      task_id: null, // Use task_id instead of phase_id
      notes: taskDescription, // Use notes instead of task_description  
      hourly_rate: hourlyRate,
      hours_worked: 0,
      total_cost: 0,
      entry_date: new Date().toISOString().split('T')[0],
      organization_id: '00000000-0000-0000-0000-000000000000'
    });
  };

  const stopTimer = async (id: string) => {
    // Timer functionality not supported in current schema
    return await updateEntry(id, {
      hours_worked: 8, // Default to 8 hours
      total_cost: 0 // Will be calculated separately
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