import { TimeEntry } from '@/hooks/useTimeSheet';
import { mockTimeSheetData } from '@/mocks/timeSheet';

/**
 * Mock time sheet service for managing time entries
 * In a real application, this would connect to your backend API
 */
class TimeSheetService {
  private entries: TimeEntry[] = mockTimeSheetData;

  /**
   * Get all time entries for a specific date
   */
  async getEntriesByDate(date: string): Promise<TimeEntry[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      const queryDate = new Date(date);
      return entryDate.toDateString() === queryDate.toDateString();
    });
  }

  /**
   * Get all time entries for a specific user
   */
  async getEntriesByUser(userId: string): Promise<TimeEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.entries.filter(entry => entry.userId === userId);
  }

  /**
   * Get time entries for a date range
   */
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<TimeEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
  }

  /**
   * Create a new time entry
   */
  async createEntry(entryData: Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newEntry: TimeEntry = {
      ...entryData,
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'current_user', // In real app, get from auth context
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.entries.push(newEntry);
    return newEntry;
  }

  /**
   * Update an existing time entry
   */
  async updateEntry(id: string, updates: Partial<Pick<TimeEntry, 'hours' | 'notes'>>): Promise<TimeEntry> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const entryIndex = this.entries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) {
      throw new Error('Time entry not found');
    }
    
    this.entries[entryIndex] = {
      ...this.entries[entryIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    return this.entries[entryIndex];
  }

  /**
   * Delete a time entry
   */
  async deleteEntry(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const entryIndex = this.entries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) {
      throw new Error('Time entry not found');
    }
    
    this.entries.splice(entryIndex, 1);
  }

  /**
   * Get total hours for a specific date
   */
  async getTotalHoursByDate(date: string): Promise<number> {
    const entries = await this.getEntriesByDate(date);
    return entries.reduce((total, entry) => total + entry.hours, 0);
  }

  /**
   * Get total hours for a user in a date range
   */
  async getTotalHoursByUserAndDateRange(userId: string, startDate: string, endDate: string): Promise<number> {
    const entries = await this.getEntriesByDateRange(startDate, endDate);
    const userEntries = entries.filter(entry => entry.userId === userId);
    return userEntries.reduce((total, entry) => total + entry.hours, 0);
  }
}

export const timeSheetService = new TimeSheetService();