import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface WorkerSummary {
  id: string;
  name: string;
  avatar_url: string | null;
  is_primary: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  projectName: string;
  phaseId?: string;
  phaseName?: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  attachments?: string[];
  comments?: TaskComment[];
  // New approval fields
  approved_at?: string | null;
  approved_by?: string | null;
  signature_url?: string | null;
  workers?: WorkerSummary[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  user: string;
  message: string;
  createdAt: string;
}

export interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  projectId?: string;
  dueDate?: 'overdue' | 'today' | 'week' | 'month';
  search?: string;
}

/**
 * Hook for managing user tasks
 */
export function useTasks(filters?: TaskFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', user?.id, filters],
    queryFn: () => taskService.getTasks(user?.id, filters),
    enabled: !!user?.id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return taskService.addComment(taskId, message, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const markCompleted = async (taskId: string) => {
    return updateTaskMutation.mutateAsync({
      id: taskId,
      updates: { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      }
    });
  };

  const updateStatus = async (taskId: string, status: Task['status']) => {
    return updateTaskMutation.mutateAsync({
      id: taskId,
      updates: { 
        status,
        updatedAt: new Date().toISOString()
      }
    });
  };

  const addComment = async (taskId: string, message: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    return addCommentMutation.mutateAsync({ taskId, message });
  };

  return {
    ...query,
    tasks: query.data || [],
    markCompleted,
    updateStatus,
    addComment,
    isUpdating: updateTaskMutation.isPending || addCommentMutation.isPending,
  };
}

/**
 * Hook for assigning workers to tasks
 */
export function useAssignWorkers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, userIds, primaryId }: { 
      taskId: string; 
      userIds: string[]; 
      primaryId: string;
    }) => {
      return taskService.assignWorkers(taskId, userIds, primaryId);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (error) => {
      console.error('Failed to assign workers:', error);
    }
  });
}

/**
 * Hook for approving tasks with signature
 */
export function useApproveTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, signatureBlob }: { 
      taskId: string; 
      signatureBlob?: Blob;
    }) => {
      return taskService.approveTask(taskId, user?.id, signatureBlob);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
    },
    onError: (error) => {
      console.error('Failed to approve task:', error);
    }
  });
}

/**
 * Hook for bulk task assignment
 */
export function useBulkAssign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assignments }: { 
      assignments: Array<{
        taskId: string;
        userIds: string[];
        primaryId: string;
      }>;
    }) => {
      return taskService.bulkAssignWorkers(assignments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Failed to bulk assign workers:', error);
    }
  });
}

/**
 * Hook for unassigned tasks in a project
 */
export function useUnassignedTasks(projectId: string) {
  return useQuery({
    queryKey: ['unassigned-tasks', projectId],
    queryFn: async () => {
      console.log('🔍 Fetching unassigned tasks for project:', projectId);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          priority,
          project:projects(name),
          phase:project_phases(name)
        `)
        .eq('project_id', projectId)
        .is('assigned_to', null)
        .eq('status', 'todo')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching unassigned tasks:', error);
        throw error;
      }
      
      console.log('📋 Unassigned tasks result:', data);
      return data || [];
    },
    enabled: !!projectId,
  });
}

/**
 * Hook for task statistics and analytics
 */
export function useTaskStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['task-stats', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return taskService.getTaskStats(user.id);
    },
    enabled: !!user?.id,
  });
}