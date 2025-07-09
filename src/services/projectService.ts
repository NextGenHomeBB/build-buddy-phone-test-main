import { supabase } from '@/integrations/supabase/client';

export const projectService = {
  async getProjects() {
    console.log('📂 getProjects called');
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        manager:profiles!manager_id(name)
      `)
      .order('created_at', { ascending: false });
    
    console.log('📋 All projects result:', data, error);
    if (error) throw error;
    return data;
  },

  async getAccessibleProjects() {
    console.log('🔍 getAccessibleProjects called');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.id, user?.email);
    
    if (!user) {
      console.log('❌ No user found');
      throw new Error('Not authenticated');
    }

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('👥 User profile:', profile);

    // Admin and managers see all projects
    if (profile?.role === 'admin' || profile?.role === 'manager') {
      console.log('🔑 User is admin/manager, fetching all projects');
      return this.getProjects();
    }

    console.log('🔒 User is worker, fetching accessible projects');
    // Workers see projects they have specific access to via user_project_role
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        manager:profiles!manager_id(name),
        user_project_roles:user_project_role!inner(role)
      `)
      .eq('user_project_role.user_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log('📋 Worker projects result:', data, error);
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