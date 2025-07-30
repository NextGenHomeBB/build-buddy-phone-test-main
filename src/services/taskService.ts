import { supabase } from '@/integrations/supabase/client';
import { upsertUserProjectRole } from '@/services/userProjectRole.service';

export const taskService = {
  async getTasks(userId?: string, filters?: any) {
    console.log('🔍 [TASK DEBUG] getTasks called with userId:', userId, 'filters:', filters);
    let query;
    
    if (userId) {
      // Get the current user's profile ID (they might have their own profile)
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      
      const userProfileId = userProfile?.id;
      console.log('👤 User profile ID:', userProfileId);
      
      // Get linked placeholder profile IDs for this auth user
      const { data: linkedProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', userId);
      
      const linkedProfileIds = linkedProfiles?.map(p => p.id) || [];
      console.log('👥 All linked profiles found:', linkedProfileIds);
      
      // Get task IDs from task_workers table using all possible user representations
      const searchIds = [userId, ...linkedProfileIds].filter(Boolean);
      console.log('🔍 Searching task_workers with IDs:', searchIds);
      
      let taskWorkerTaskIds = [];
      
      if (searchIds.length > 0) {
        const { data: taskWorkers } = await supabase
          .from('task_workers')
          .select('task_id')
          .in('user_id', searchIds);
        
        console.log('📝 Task workers found:', taskWorkers);
        taskWorkerTaskIds = taskWorkers?.map(tw => tw.task_id) || [];
      }
      
      console.log('🎯 Task worker task IDs:', taskWorkerTaskIds);
      
      // Build the comprehensive query
      query = supabase
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
            user_profile:profiles!fk_task_workers_user_id(id, name, avatar_url)
          ),
          comments:task_comments(
            *,
            user:profiles(name)
          )
        `);
      
      // Add all the OR conditions for task assignment
      const conditions = [];
      
      // Direct assignment to auth user ID
      conditions.push(`assigned_to.eq.${userId}`);
      
      // Assignment to user's profile ID (common case)
      if (userProfileId) {
        conditions.push(`assigned_to.eq.${userProfileId}`);
      }
      
      // Assignment to any linked placeholder profiles
      if (linkedProfileIds.length > 0) {
        conditions.push(`assigned_to.in.(${linkedProfileIds.join(',')})`);
      }
      
      // Assignment via task_workers table
      if (taskWorkerTaskIds.length > 0) {
        conditions.push(`id.in.(${taskWorkerTaskIds.join(',')})`);
      }
      
      console.log('🔍 Query conditions:', conditions);
      
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      } else {
        // If no conditions, return empty result set
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    } else {
      // For admin/manager queries without userId, use regular tasks table
      query = supabase
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
            user_profile:profiles!fk_task_workers_user_id(id, name, avatar_url)
          ),
          comments:task_comments(
            *,
            user:profiles(name)
          )
        `);
    }

    // Apply filters
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
    
    if (error) {
      console.error('❌ Error in getTasks:', error);
      throw error;
    }
    
    console.log('✅ getTasks result:', data?.length, 'tasks found');
    console.log('📋 Tasks data:', data);
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

    // Auto-assign current authenticated user to project (not the placeholder assigned_to)
    // This ensures the user has access to the project they're working on
    if (data.project_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await upsertUserProjectRole(user.id, data.project_id, 'worker');
        } catch (roleError) {
          // Don't fail the task update if role assignment fails
          console.warn('Failed to assign user to project role:', roleError);
        }
      }
    }

    return data;
  },

  async addComment(taskId: string, message: string, userId: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        content: message,
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

    // Update assigned_to field for consistency
    await supabase
      .from('tasks')
      .update({ assigned_to: primaryId })
      .eq('id', taskId);

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
        status: 'completed'
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
    // Get the current user's profile ID
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();
    
    const userProfileId = userProfile?.id;
    
    // Get linked placeholder profile IDs for this auth user
    const { data: linkedProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId);
    
    const linkedProfileIds = linkedProfiles?.map(p => p.id) || [];
    
    // Get task IDs from task_workers table using all possible user representations
    const searchIds = [userId, ...linkedProfileIds].filter(Boolean);
    
    let taskWorkerTaskIds = [];
    if (searchIds.length > 0) {
      const { data: taskWorkerTasks } = await supabase
        .from('task_workers')
        .select('task_id')
        .in('user_id', searchIds);
      
      taskWorkerTaskIds = taskWorkerTasks?.map(tw => tw.task_id) || [];
    }
    
    // Build the query with all assignment methods
    const conditions = [];
    
    // Direct assignment to auth user ID
    conditions.push(`assigned_to.eq.${userId}`);
    
    // Assignment to user's profile ID (common case)
    if (userProfileId) {
      conditions.push(`assigned_to.eq.${userProfileId}`);
    }
    
    // Assignment to any linked placeholder profiles
    if (linkedProfileIds.length > 0) {
      conditions.push(`assigned_to.in.(${linkedProfileIds.join(',')})`);
    }
    
    // Assignment via task_workers table
    if (taskWorkerTaskIds.length > 0) {
      conditions.push(`id.in.(${taskWorkerTaskIds.join(',')})`);
    }
    
    if (conditions.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        review: 0
      };
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .select('status')
      .or(conditions.join(','));
    
    if (error) throw error;
    
    const stats = {
      total: data?.length || 0,
      completed: data?.filter(t => t.status === 'completed').length || 0,
      inProgress: data?.filter(t => t.status === 'in-progress').length || 0,
      todo: data?.filter(t => t.status === 'todo').length || 0,
      review: data?.filter(t => t.status === 'review').length || 0
    };
    
    return stats;
  }
};