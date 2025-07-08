import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { timeSheetService } from '@/services/timeSheetService';

export interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  notes: string;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook for managing time sheet entries
 * @param selectedDate - The date to filter entries by
 * @returns Time sheet data and mutation functions
 */
export function useTimeSheet(selectedDate: Date) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await timeSheetService.getEntriesByDate(dateStr);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entryData: Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEntry = await timeSheetService.createEntry(entryData);
      setEntries(prev => [...prev, newEntry]);
      return newEntry;
    } catch (error) {
      console.error('Failed to add time entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<Pick<TimeEntry, 'hours' | 'notes'>>) => {
    try {
      const updatedEntry = await timeSheetService.updateEntry(id, updates);
      setEntries(prev => prev.map(entry => 
        entry.id === id ? updatedEntry : entry
      ));
      return updatedEntry;
    } catch (error) {
      console.error('Failed to update time entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await timeSheetService.deleteEntry(id);
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      throw error;
    }
  };

  return {
    data: entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: loadEntries
  };
}