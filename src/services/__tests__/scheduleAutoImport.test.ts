import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoCreateMissingProjectsAndWorkers, getNewItemsPreview } from '../scheduleAutoImport.service';
import type { ParsedSchedule } from '@/lib/parseDagschema';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }))
  }
}));

describe('scheduleAutoImport', () => {
  const mockParsedSchedule: ParsedSchedule = {
    workDate: new Date('2024-01-15'),
    items: [
      {
        address: 'New Project Location',
        category: 'normal',
        startTime: '09:00',
        endTime: '17:00',
        workers: [
          { name: 'John Doe', isAssistant: false },
          { name: 'Jane Smith', isAssistant: true }
        ]
      }
    ],
    absences: [
      { workerName: 'Bob Johnson', reason: 'sick' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should identify new projects and workers', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Mock existing data (empty - everything is new)
    const mockFrom = supabase.from as any;
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnValue({
        data: [],
        error: null
      }),
      ilike: vi.fn().mockReturnThis(),
    });

    const preview = await getNewItemsPreview(mockParsedSchedule);

    expect(preview.newProjects).toContain('New Project Location');
    expect(preview.newWorkers).toContain('John Doe');
    expect(preview.newWorkers).toContain('Jane Smith');
    expect(preview.newWorkers).toContain('Bob Johnson');
  });

  it('should not identify existing items as new', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Mock existing data
    const mockFrom = supabase.from as any;
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnValue({
        data: [
          { name: 'New Project Location' },
          { name: 'John Doe' }
        ],
        error: null
      }),
      ilike: vi.fn().mockReturnThis(),
    });

    const preview = await getNewItemsPreview(mockParsedSchedule);

    expect(preview.newProjects).not.toContain('New Project Location');
    expect(preview.newWorkers).not.toContain('John Doe');
    expect(preview.newWorkers).toContain('Jane Smith');
    expect(preview.newWorkers).toContain('Bob Johnson');
  });

  it('should create projects and workers', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'project-123' },
          error: null
        })
      })
    });

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    const mockFrom = supabase.from as any;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects' || table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnValue({ data: [], error: null }),
          insert: mockInsert,
          ilike: vi.fn().mockReturnThis(),
        };
      }
      if (table === 'project_phases' || table === 'user_project_role') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          upsert: mockUpsert,
        };
      }
      return {};
    });

    const result = await autoCreateMissingProjectsAndWorkers(mockParsedSchedule);

    expect(result.createdProjects).toBe(1);
    expect(result.createdWorkers).toBe(3);
    expect(result.projectMapping).toHaveProperty('New Project Location');
    expect(result.workerMapping).toHaveProperty('John Doe');
  });
});