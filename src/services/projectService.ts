// Simplified project service to fix schema issues
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  organization_id: string;
  manager_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  spent?: number;
  progress?: number;
  created_at: string;
  updated_at: string;
  location?: string;
  type?: string;
  remaining_budget?: number;
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    if (!project.name) {
      throw new Error('Project name is required');
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        organization_id: '00000000-0000-0000-0000-000000000001',
        status: project.status || 'draft',
        budget: project.budget || 0,
        spent: project.spent || 0,
        progress: project.progress || 0,
        manager_id: project.manager_id,
        start_date: project.start_date,
        end_date: project.end_date
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getAccessibleProjects(): Promise<Project[]> {
    return this.getProjects();
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async seedProject(projectId: string): Promise<void> {
    console.warn('Project seeding temporarily disabled - schema mismatch');
  }
};