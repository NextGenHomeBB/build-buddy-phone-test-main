import { supabase } from '@/integrations/supabase/client';
import { defaultPhases } from '@/templates/defaultPhases';
import { upsertUserProjectRole } from './userProjectRole.service';

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
    console.log('🚀 Creating project:', project);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      // Start transaction by creating the project first
      const { data: createdProject, error: projectError } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (projectError) {
        console.error('❌ Project creation error:', projectError);
        throw new Error(projectError.message || 'Failed to create project');
      }

      console.log('📊 Project created:', createdProject);

      // Assign creating user as manager
      await upsertUserProjectRole(user.id, createdProject.id, 'manager');
      console.log('👤 User assigned as manager');

      // Create default phases and tasks
      for (const phaseTemplate of defaultPhases) {
        // Create the phase
        const { data: createdPhase, error: phaseError } = await supabase
          .from('project_phases')
          .insert({
            project_id: createdProject.id,
            name: phaseTemplate.name,
            description: phaseTemplate.description,
            status: 'planning',
            progress: 0,
            budget: 0,
            spent: 0
          })
          .select()
          .single();

        if (phaseError) {
          console.error('❌ Phase creation error:', phaseError);
          throw new Error(`Failed to create phase: ${phaseTemplate.name}`);
        }

        console.log('📋 Phase created:', createdPhase);

        // Create tasks for each checklist item
        const tasks = phaseTemplate.checklist.map((item, index) => ({
          project_id: createdProject.id,
          phase_id: createdPhase.id,
          title: item,
          description: `${phaseTemplate.name} - ${item}`,
          status: 'todo' as const,
          priority: 'medium' as const,
          assigned_by: user.id
        }));

        if (tasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('tasks')
            .insert(tasks);

          if (tasksError) {
            console.error('❌ Tasks creation error:', tasksError);
            throw new Error(`Failed to create tasks for phase: ${phaseTemplate.name}`);
          }

          console.log(`✅ Created ${tasks.length} tasks for ${phaseTemplate.name}`);
        }
      }

      console.log('🎉 Project created successfully with default phases and tasks');
      return createdProject;

    } catch (error) {
      console.error('❌ Project creation transaction failed:', error);
      // Note: Supabase doesn't support manual transactions in the client,
      // but we can rely on individual operation failures to prevent partial state
      throw error;
    }
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