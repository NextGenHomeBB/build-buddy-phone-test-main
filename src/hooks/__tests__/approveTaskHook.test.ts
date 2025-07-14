import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApproveTask } from '../useTasks';
import { taskService } from '@/services/taskService';

// Mock the taskService
vi.mock('@/services/taskService', () => ({
  taskService: {
    approveTask: vi.fn()
  }
}));

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useApproveTask', () => {
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

  it('should approve task with signature', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    const mockApproveTask = vi.mocked(taskService.approveTask);
    
    mockApproveTask.mockResolvedValue({
      id: 'task-1',
      approved_at: '2023-01-01T00:00:00Z',
      approved_by: 'test-user-id',
      signature_url: 'https://example.com/signature.jpg'
    });

    const { result } = renderHook(() => useApproveTask(), { wrapper });

    result.current.mutate({
      taskId: 'task-1',
      signatureBlob: mockBlob
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApproveTask).toHaveBeenCalledWith(
      'task-1',
      'test-user-id',
      mockBlob
    );
  });

  it('should approve task without signature', async () => {
    const mockApproveTask = vi.mocked(taskService.approveTask);
    
    mockApproveTask.mockResolvedValue({
      id: 'task-1',
      approved_at: '2023-01-01T00:00:00Z',
      approved_by: 'test-user-id',
      signature_url: null
    });

    const { result } = renderHook(() => useApproveTask(), { wrapper });

    result.current.mutate({
      taskId: 'task-1'
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApproveTask).toHaveBeenCalledWith(
      'task-1',
      'test-user-id',
      undefined
    );
  });

  it('should handle approval errors', async () => {
    const mockApproveTask = vi.mocked(taskService.approveTask);
    mockApproveTask.mockRejectedValue(new Error('Approval failed'));

    const { result } = renderHook(() => useApproveTask(), { wrapper });

    result.current.mutate({
      taskId: 'task-1'
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Approval failed'));
  });

  it('should invalidate queries on success', async () => {
    const mockApproveTask = vi.mocked(taskService.approveTask);
    mockApproveTask.mockResolvedValue({
      id: 'task-1',
      approved_at: '2023-01-01T00:00:00Z',
      approved_by: 'test-user-id',
      signature_url: null
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useApproveTask(), { wrapper });

    result.current.mutate({
      taskId: 'task-1'
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['task', 'task-1'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['approval-queue'] });
  });
});