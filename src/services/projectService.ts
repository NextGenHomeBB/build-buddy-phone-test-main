import { supabase } from '@/integrations/supabase/client';

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

  async getAccessibleProjects() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Admin and managers see all projects
    if (profile?.role === 'admin' || profile?.role === 'manager') {
      return this.getProjects();
    }

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