import { supabase } from '@/integrations/supabase/client';

export const taskService = {
  async getTasks(userId?: string, filters?: any) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:projects(name),
        phase:project_phases(name),
        assigned_user:profiles!assigned_to(name),
        assigned_by_user:profiles!assigned_by(name),
        comments:task_comments(
          *,
          user:profiles(name)
        )
      `);

    if (userId) {
      query = query.eq('assigned_to', userId);
    }

    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.priority?.length) {
      query = query.in('priority', filters.priority);
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: any) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async addComment(taskId: string, message: string, userId: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        message,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTaskStats(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('assigned_to', userId);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      completed: data.filter(t => t.status === 'completed').length,
      inProgress: data.filter(t => t.status === 'in-progress').length,
      todo: data.filter(t => t.status === 'todo').length,
      review: data.filter(t => t.status === 'review').length
    };
    
    return stats;
  }
};