import { TimeEntry } from '@/hooks/useTimeSheet';

/**
 * Mock time sheet data for development and testing
 */
export const mockTimeSheetData: TimeEntry[] = [
  {
    id: 'entry_1',
    date: new Date('2024-11-18'),
    hours: 8.0,
    notes: 'Foundation pour and inspection',
    projectId: 'project_1',
    userId: 'user_1',
    createdAt: new Date('2024-11-18T08:00:00Z'),
    updatedAt: new Date('2024-11-18T16:30:00Z')
  },
  {
    id: 'entry_2',
    date: new Date('2024-11-18'),
    hours: 2.5,
    notes: 'Site cleanup and material prep',
    projectId: 'project_2',
    userId: 'user_1',
    createdAt: new Date('2024-11-18T16:45:00Z'),
    updatedAt: new Date('2024-11-18T16:45:00Z')
  },
  {
    id: 'entry_3',
    date: new Date('2024-11-17'),
    hours: 7.5,
    notes: 'Electrical rough-in and testing',
    projectId: 'project_1',
    userId: 'user_1',
    createdAt: new Date('2024-11-17T07:30:00Z'),
    updatedAt: new Date('2024-11-17T15:30:00Z')
  },
  {
    id: 'entry_4',
    date: new Date('2024-11-17'),
    hours: 1.0,
    notes: 'Team meeting and daily standup',
    projectId: 'project_3',
    userId: 'user_1',
    createdAt: new Date('2024-11-17T09:00:00Z'),
    updatedAt: new Date('2024-11-17T09:00:00Z')
  },
  {
    id: 'entry_5',
    date: new Date('2024-11-16'),
    hours: 8.0,
    notes: 'Drywall installation and finishing',
    projectId: 'project_2',
    userId: 'user_1',
    createdAt: new Date('2024-11-16T08:00:00Z'),
    updatedAt: new Date('2024-11-16T17:00:00Z')
  },
  {
    id: 'entry_6',
    date: new Date('2024-11-15'),
    hours: 6.0,
    notes: 'Plumbing rough-in installation',
    projectId: 'project_1',
    userId: 'user_1',
    createdAt: new Date('2024-11-15T08:30:00Z'),
    updatedAt: new Date('2024-11-15T15:00:00Z')
  },
  {
    id: 'entry_7',
    date: new Date('2024-11-15'),
    hours: 2.0,
    notes: 'Safety inspection walkthrough',
    projectId: 'project_3',
    userId: 'user_1',
    createdAt: new Date('2024-11-15T15:30:00Z'),
    updatedAt: new Date('2024-11-15T15:30:00Z')
  },
  {
    id: 'entry_8',
    date: new Date('2024-11-14'),
    hours: 4.5,
    notes: 'HVAC ductwork installation',
    projectId: 'project_2',
    userId: 'user_1',
    createdAt: new Date('2024-11-14T10:00:00Z'),
    updatedAt: new Date('2024-11-14T14:30:00Z')
  },
  {
    id: 'entry_9',
    date: new Date('2024-11-14'),
    hours: 3.5,
    notes: 'Material delivery coordination',
    projectId: 'project_1',
    userId: 'user_1',
    createdAt: new Date('2024-11-14T08:00:00Z'),
    updatedAt: new Date('2024-11-14T11:30:00Z')
  },
  {
    id: 'entry_10',
    date: new Date('2024-11-13'),
    hours: 8.0,
    notes: 'Structural steel inspection and welding',
    projectId: 'project_3',
    userId: 'user_1',
    createdAt: new Date('2024-11-13T07:00:00Z'),
    updatedAt: new Date('2024-11-13T16:00:00Z')
  }
];