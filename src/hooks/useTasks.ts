import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/contexts/AuthContext';

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
    queryFn: () => taskService.getTasks(user?.id || '', filters),
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
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) =>
      taskService.addComment(taskId, message, user?.id || ''),
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
 * Hook for task statistics and analytics
 */
export function useTaskStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['task-stats', user?.id],
    queryFn: () => taskService.getTaskStats(user?.id || ''),
    enabled: !!user?.id,
  });
}