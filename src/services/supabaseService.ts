import { supabase } from '@/integrations/supabase/client';

// Project services
export const projectService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        manager:profiles!manager_id(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        manager:profiles!manager_id(name),
        phases:project_phases(*),
        materials:project_materials(
          *,
          material:materials(name, unit)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProject(project: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Task services
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

// Time sheet services
export const timeSheetService = {
  async getTimeSheets(userId: string, filters?: any) {
    let query = supabase
      .from('time_sheets')
      .select(`
        *,
        project:projects(name),
        task:tasks(title)
      `)
      .eq('user_id', userId);

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTimeSheet(timeSheet: any) {
    const { data, error } = await supabase
      .from('time_sheets')
      .insert(timeSheet)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTimeSheet(id: string, updates: any) {
    const { data, error } = await supabase
      .from('time_sheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTimeSheet(id: string) {
    const { error } = await supabase
      .from('time_sheets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Material services
export const materialService = {
  async getMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async createMaterial(material: any) {
    const { data, error } = await supabase
      .from('materials')
      .insert(material)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMaterial(id: string, updates: any) {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMaterial(id: string) {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Checklist services
export const checklistService = {
  async getChecklists() {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async createChecklist(checklist: any) {
    const { data, error } = await supabase
      .from('checklists')
      .insert(checklist)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateChecklist(id: string, updates: any) {
    const { data, error } = await supabase
      .from('checklists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteChecklist(id: string) {
    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// User management services
export const userManagementService = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, newRole: 'admin' | 'manager' | 'worker' | 'viewer') {
    const { data, error } = await supabase
      .rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });
    
    if (error) throw error;
    return data;
  },

  async getUserStats() {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('role');
    
    if (error) throw error;
    
    const stats = {
      total: users.length,
      active: users.length,
      pending: 0,
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      workers: users.filter(u => u.role === 'worker').length,
    };
    
    return stats;
  }
};