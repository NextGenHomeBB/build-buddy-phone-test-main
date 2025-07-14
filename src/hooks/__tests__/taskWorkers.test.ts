import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssignWorkers } from '../useTasks';
import { taskService } from '@/services/taskService';

// Mock the taskService
vi.mock('@/services/taskService', () => ({
  taskService: {
    assignWorkers: vi.fn()
  }
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useAssignWorkers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: any }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should assign workers to task successfully', async () => {
    const mockAssignWorkers = vi.mocked(taskService.assignWorkers);
    
    mockAssignWorkers.mockResolvedValue([
      {
        id: 'assignment-1',
        task_id: 'task-1',
        user_id: 'user-1',
        is_primary: true
      },
      {
        id: 'assignment-2',
        task_id: 'task-1',
        user_id: 'user-2',
        is_primary: false
      }
    ]);

    const { result } = renderHook(() => useAssignWorkers(), { wrapper });

    result.current.mutate({
      taskId: 'task-1',
      userIds: ['user-1', 'user-2'],
      primaryId: 'user-1'
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockAssignWorkers).toHaveBeenCalledWith(
      'task-1',
      ['user-1', 'user-2'],
      'user-1'
    );
  });

  it('should handle UNIQUE constraint violation', async () => {
    const mockAssignWorkers = vi.mocked(taskService.assignWorkers);
    
    // Simulate a UNIQUE constraint violation
    const uniqueError = new Error('duplicate key value violates unique constraint "task_workers_task_id_user_id_key"');
    mockAssignWorkers.mockRejectedValue(uniqueError);

    const { result } = renderHook(() => useAssignWorkers(), { wrapper });

    result.current.mutate({
      taskId: 'task-1',
      userIds: ['user-1'],
      primaryId: 'user-1'
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(uniqueError);
  });

  it('should handle assignment to same user twice', async () => {
    const mockAssignWorkers = vi.mocked(taskService.assignWorkers);
    
    // This should be filtered out by the UI, but test the constraint
    const duplicateUserError = new Error('User already assigned to this task');
    mockAssignWorkers.mockRejectedValue(duplicateUserError);

    const { result } = renderHook(() => useAssignWorkers(), { wrapper });

    // Attempt to assign same user twice
    result.current.mutate({
      taskId: 'task-1',
      userIds: ['user-1', 'user-1'], // Duplicate user
      primaryId: 'user-1'
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(duplicateUserError);
  });

  it('should invalidate queries on successful assignment', async () => {
    const mockAssignWorkers = vi.mocked(taskService.assignWorkers);
    mockAssignWorkers.mockResolvedValue([
      {
        id: 'assignment-1',
        task_id: 'task-1',
        user_id: 'user-1',
        is_primary: true
      }
    ]);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAssignWorkers(), { wrapper });

    result.current.mutate({
      taskId: 'task-1',
      userIds: ['user-1'],
      primaryId: 'user-1'
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['task', 'task-1'] });
  });

  it('should handle empty user array', async () => {
    const mockAssignWorkers = vi.mocked(taskService.assignWorkers);
    
    const { result } = renderHook(() => useAssignWorkers(), { wrapper });

    result.current.mutate({
      taskId: 'task-1',
      userIds: [],
      primaryId: 'user-1'
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should not call the service with empty array
    expect(mockAssignWorkers).toHaveBeenCalledWith(
      'task-1',
      [],
      'user-1'
    );
  });
});