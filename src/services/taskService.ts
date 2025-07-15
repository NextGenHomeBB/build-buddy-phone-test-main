import { supabase } from '@/integrations/supabase/client';
import { upsertUserProjectRole } from '@/services/userProjectRole.service';

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
        workers:task_workers(
          id,
          is_primary,
          user_id,
          user_profile:profiles(id, name, avatar_url)
        ),
        comments:task_comments(
          *,
          user:profiles(name)
        )
      `);

    if (userId) {
      // First get tasks where user is directly assigned
      const directAssignedQuery = supabase
        .from('tasks')
        .select(`
          *,
          project:projects(name),
          phase:project_phases(name),
          assigned_user:profiles!assigned_to(name),
          assigned_by_user:profiles!assigned_by(name),
          workers:task_workers(
            id,
            is_primary,
            user_id,
            user_profile:profiles(id, name, avatar_url)
          ),
          comments:task_comments(
            *,
            user:profiles(name)
          )
        `)
        .eq('assigned_to', userId);

      // Apply filters to direct assigned query
      if (filters?.status?.length) {
        directAssignedQuery.in('status', filters.status);
      }
      if (filters?.priority?.length) {
        directAssignedQuery.in('priority', filters.priority);
      }
      if (filters?.projectId) {
        directAssignedQuery.eq('project_id', filters.projectId);
      }
      if (filters?.search) {
        directAssignedQuery.ilike('title', `%${filters.search}%`);
      }

      // Second get tasks where user is in task_workers
      // First get task IDs from task_workers table
      const { data: taskWorkerData, error: taskWorkerError } = await supabase
        .from('task_workers')
        .select('task_id')
        .eq('user_id', userId);

      if (taskWorkerError) throw taskWorkerError;

      const taskIds = taskWorkerData?.map(tw => tw.task_id) || [];

      let workerAssignedQuery;
      if (taskIds.length > 0) {
        workerAssignedQuery = supabase
          .from('tasks')
          .select(`
            *,
            project:projects(name),
            phase:project_phases(name),
            assigned_user:profiles!assigned_to(name),
            assigned_by_user:profiles!assigned_by(name),
            workers:task_workers(
              id,
              is_primary,
              user_id,
              user_profile:profiles(id, name, avatar_url)
            ),
            comments:task_comments(
              *,
              user:profiles(name)
            )
          `)
          .in('id', taskIds);

        // Apply filters to worker assigned query
        if (filters?.status?.length) {
          workerAssignedQuery = workerAssignedQuery.in('status', filters.status);
        }
        if (filters?.priority?.length) {
          workerAssignedQuery = workerAssignedQuery.in('priority', filters.priority);
        }
        if (filters?.projectId) {
          workerAssignedQuery = workerAssignedQuery.eq('project_id', filters.projectId);
        }
        if (filters?.search) {
          workerAssignedQuery = workerAssignedQuery.ilike('title', `%${filters.search}%`);
        }

        // Execute both queries
        const [directResult, workerResult] = await Promise.all([
          directAssignedQuery.order('created_at', { ascending: false }),
          workerAssignedQuery.order('created_at', { ascending: false })
        ]);

        if (directResult.error) throw directResult.error;
        if (workerResult.error) throw workerResult.error;

        // Combine and deduplicate results
        const allTasks = [...(directResult.data || []), ...(workerResult.data || [])];
        const uniqueTasks = allTasks.filter((task, index, self) => 
          index === self.findIndex(t => t.id === task.id)
        );

        return uniqueTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        // If no task IDs found in task_workers, just return direct assigned tasks
        const directResult = await directAssignedQuery.order('created_at', { ascending: false });
        if (directResult.error) throw directResult.error;
        return directResult.data || [];
      }
    }

    // If no userId, apply other filters
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

  async getUnassignedTasks(projectId?: string) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:projects(name),
        phase:project_phases(name)
      `)
      .is('assigned_to', null)
      .eq('status', 'todo');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTask(taskData: any) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) throw error;

    // Auto-assign user to project if task has an assignee
    if (data.assigned_to && data.project_id) {
      await upsertUserProjectRole(data.assigned_to, data.project_id, 'worker');
    }

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

    // Auto-assign user to project if task has an assignee
    if (data.assigned_to && data.project_id) {
      await upsertUserProjectRole(data.assigned_to, data.project_id, 'worker');
    }

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

  async assignWorkers(taskId: string, userIds: string[], primaryId: string) {
    // Delete existing assignments
    await supabase
      .from('task_workers')
      .delete()
      .eq('task_id', taskId);

    // Insert new assignments
    const assignments = userIds.map(userId => ({
      task_id: taskId,
      user_id: userId,
      is_primary: userId === primaryId
    }));

    const { data, error } = await supabase
      .from('task_workers')
      .insert(assignments)
      .select();
    
    if (error) throw error;

    // Trigger notification for assignments
    try {
      await supabase.functions.invoke('notify_task_assignment', {
        body: {
          task_id: taskId,
          assigned_users: userIds,
          primary_user: primaryId
        }
      });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    return data;
  },

  async approveTask(taskId: string, approverId?: string, signatureBlob?: Blob) {
    let signatureUrl = null;

    // Upload signature if provided
    if (signatureBlob) {
      // Convert to JPEG for optimization (0.6 quality = ~70% size reduction)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const compressedBlob = await new Promise<Blob>((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob(resolve, 'image/jpeg', 0.6);
        };
        img.src = URL.createObjectURL(signatureBlob);
      });

      const fileName = `signature_${taskId}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, compressedBlob!, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);
      
      signatureUrl = urlData.publicUrl;
    }

    // Update task with approval information
    const { data, error } = await supabase
      .from('tasks')
      .update({
        approved_at: new Date().toISOString(),
        approved_by: approverId,
        signature_url: signatureUrl
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // Trigger notification
    try {
      await supabase.functions.invoke('notify_task_approved', {
        body: {
          task_id: taskId,
          approved_by: approverId,
          approved_at: new Date().toISOString()
        }
      });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    return data;
  },

  async bulkAssignWorkers(assignments: Array<{
    taskId: string;
    userIds: string[];
    primaryId: string;
  }>) {
    // Use edge function for bulk operations to handle 1000+ tasks efficiently
    const { data, error } = await supabase.functions.invoke('assign_workers_bulk', {
      body: { assignments }
    });

    if (error) throw error;
    return data;
  },

  async getTaskStats(userId: string) {
    // Get tasks where user is directly assigned
    const { data: directTasks, error: directError } = await supabase
      .from('tasks')
      .select('status')
      .eq('assigned_to', userId);
    
    if (directError) throw directError;

    // Get task IDs from task_workers table
    const { data: taskWorkerData, error: taskWorkerError } = await supabase
      .from('task_workers')
      .select('task_id')
      .eq('user_id', userId);

    if (taskWorkerError) throw taskWorkerError;

    const taskIds = taskWorkerData?.map(tw => tw.task_id) || [];

    let workerTasks = [];
    if (taskIds.length > 0) {
      const { data: workerTasksData, error: workerError } = await supabase
        .from('tasks')
        .select('status')
        .in('id', taskIds);
      
      if (workerError) throw workerError;
      workerTasks = workerTasksData || [];
    }

    // Combine and deduplicate
    const allTasks = [...(directTasks || []), ...workerTasks];
    const uniqueTasks = allTasks.filter((task, index, self) => 
      index === self.findIndex(t => JSON.stringify(t) === JSON.stringify(task))
    );
    
    const stats = {
      total: uniqueTasks.length,
      completed: uniqueTasks.filter(t => t.status === 'completed').length,
      inProgress: uniqueTasks.filter(t => t.status === 'in-progress').length,
      todo: uniqueTasks.filter(t => t.status === 'todo').length,
      review: uniqueTasks.filter(t => t.status === 'review').length
    };
    
    return stats;
  }
};