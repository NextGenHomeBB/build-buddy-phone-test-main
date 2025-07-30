import { supabase } from '@/integrations/supabase/client';
import { defaultPhases } from '@/templates/defaultPhases';

export const projectSeedingService = {
  async seedProjectPhases(projectId: string) {
    console.log('🌱 Starting phase seeding for project:', projectId);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      // Create phases with tasks for each default phase
      for (let index = 0; index < defaultPhases.length; index++) {
        const phaseTemplate = defaultPhases[index];
        
        // Insert phase
        const { data: createdPhase, error: phaseError } = await supabase
          .from('project_phases')
          .insert({
            project_id: projectId,
            name: phaseTemplate.name,
            description: `Phase: ${phaseTemplate.name}`,
            status: 'pending',
            progress: 0,
            budget: 0,
            spent: 0,
            organization_id: '00000000-0000-0000-0000-000000000001'
          })
          .select()
          .single();

        if (phaseError) {
          console.error('❌ Phase creation error:', phaseError);
          throw phaseError;
        }

        console.log('📋 Phase created:', createdPhase);

        // Create tasks for each checklist item
        for (const checklistItem of phaseTemplate.checklist) {
          const { error: taskError } = await supabase
            .from('tasks')
            .insert({
              project_id: projectId,
              phase_id: createdPhase.id,
              title: checklistItem,
              description: `${phaseTemplate.name} - ${checklistItem}`,
              status: 'pending',
              priority: 'medium',
              organization_id: '00000000-0000-0000-0000-000000000001'
            });

          if (taskError) {
            console.error('❌ Task creation error:', taskError);
            throw taskError;
          }
        }

        console.log(`✅ Created ${phaseTemplate.checklist.length} tasks for ${phaseTemplate.name}`);
      }

      console.log('🎉 Phase seeding completed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Phase seeding failed:', error);
      throw error;
    }
  }
};