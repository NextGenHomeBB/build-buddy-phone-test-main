import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockInvoke = vi.fn();
const mockSupabase = {
  functions: {
    invoke: mockInvoke,
  },
  auth: {
    getSession: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock the invite function logic
const inviteWorker = async (email: string, role: string, organizationId: string) => {
  const { data, error } = await mockSupabase.functions.invoke('send-invite', {
    body: {
      email,
      role,
      organization_id: organizationId,
      message: `You've been invited to join our team as a ${role}. Welcome aboard!`,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to send invitation');
  }

  return data;
};

describe('Invite Worker Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully send an invitation and mark it as sent', async () => {
    // Mock successful response
    mockInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Invitation sent successfully',
        user: { id: 'test-user-id', email: 'test@example.com' },
      },
      error: null,
    });

    const result = await inviteWorker('test@example.com', 'worker', 'org-123');

    expect(mockInvoke).toHaveBeenCalledWith('send-invite', {
      body: {
        email: 'test@example.com',
        role: 'worker',
        organization_id: 'org-123',
        message: "You've been invited to join our team as a worker. Welcome aboard!",
      },
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Invitation sent successfully');
    expect(result.user).toEqual({ id: 'test-user-id', email: 'test@example.com' });
  });

  it('should handle invitation errors properly', async () => {
    // Mock error response
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email already exists' },
    });

    await expect(inviteWorker('existing@example.com', 'worker', 'org-123')).rejects.toThrow(
      'Email already exists'
    );

    expect(mockInvoke).toHaveBeenCalledWith('send-invite', {
      body: {
        email: 'existing@example.com',
        role: 'worker',
        organization_id: 'org-123',
        message: "You've been invited to join our team as a worker. Welcome aboard!",
      },
    });
  });

  it('should handle network errors', async () => {
    // Mock network error
    mockInvoke.mockRejectedValueOnce(new Error('Network error'));

    await expect(inviteWorker('test@example.com', 'worker', 'org-123')).rejects.toThrow(
      'Network error'
    );
  });

  it('should handle different roles correctly', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, message: 'Invitation sent successfully' },
      error: null,
    });

    await inviteWorker('manager@example.com', 'manager', 'org-123');

    expect(mockInvoke).toHaveBeenCalledWith('send-invite', {
      body: {
        email: 'manager@example.com',
        role: 'manager',
        organization_id: 'org-123',
        message: "You've been invited to join our team as a manager. Welcome aboard!",
      },
    });
  });
});