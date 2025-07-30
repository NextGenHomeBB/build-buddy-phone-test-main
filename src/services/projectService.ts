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
      .eq('id', user.id)
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
    console.log('🔍 getProject called for ID:', id);
    
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
      .order('created_at', { ascending: true, referencedTable: 'project_phases' })
      .maybeSingle();
    
    console.log('📊 getProject result:', { data, error, projectId: id });
    
    if (error) {
      console.error('❌ getProject error:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('⚠️ Project not found:', id);
      throw new Error(`Project with ID ${id} not found`);
    }
    
    return data;
  },

  async createProject(project: any) {
    console.log('🚀 Creating project:', project);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    try {
      // Step 1: Create the project
      const { data: createdProject, error: projectError } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (projectError) {
        console.error('❌ Project creation error:', projectError);
        return { data: null, error: projectError };
      }

      console.log('📊 Project created:', createdProject);

      // Step 2: Loop over defaultPhases and create phases with tasks
      for (let index = 0; index < defaultPhases.length; index++) {
        const phaseTemplate = defaultPhases[index];
        
        // Insert phase with order_index
        const { data: createdPhase, error: phaseError } = await supabase
          .from('project_phases')
          .insert({
            project_id: createdProject.id,
            name: phaseTemplate.name,
            description: `Phase: ${phaseTemplate.name}`,
            status: 'planning',
            progress: 0,
            budget: 0,
            spent: 0
          })
          .select()
          .single();

        if (phaseError) {
          console.error('❌ Phase creation error:', phaseError);
          return { data: null, error: phaseError };
        }

        console.log('📋 Phase created:', createdPhase);

        // Create tasks for each checklist item
        for (const checklistItem of phaseTemplate.checklist) {
          const { error: taskError } = await supabase
            .from('tasks')
            .insert({
              project_id: createdProject.id,
              phase_id: createdPhase.id,
              title: checklistItem,
              description: `${phaseTemplate.name} - ${checklistItem}`,
              status: 'todo',
              priority: 'medium',
              assigned_by: user.id
            });

          if (taskError) {
            console.error('❌ Task creation error:', taskError);
            return { data: null, error: taskError };
          }
        }

        console.log(`✅ Created ${phaseTemplate.checklist.length} tasks for ${phaseTemplate.name}`);
      }

      // Step 3: Assign creating user as manager
      await upsertUserProjectRole(user.id, createdProject.id, 'manager');
      console.log('👤 User assigned as manager');

      console.log('🎉 Project created successfully with default phases and tasks');
      return { data: createdProject, error: null };

    } catch (error) {
      console.error('❌ Project creation transaction failed:', error);
      return { data: null, error: error as Error };
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
  },

  async deleteProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};