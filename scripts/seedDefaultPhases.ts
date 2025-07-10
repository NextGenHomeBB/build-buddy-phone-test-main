import { createClient } from '@supabase/supabase-js';
import { defaultPhases } from '../src/templates/defaultPhases';

// Initialize Supabase client
const supabaseUrl = 'https://kgrjpyxoymhwillhmjjh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncmpweXhveW1od2lsbGhtampoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk3MTc3NiwiZXhwIjoyMDY3NTQ3Nzc2fQ.mBNkxbfuEhvA7_ys_EcLcmB3NwLwbwJ1r7-j2JvOOcE'; // Service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDefaultPhases() {
  console.log('🌱 Starting default phases seeding...');

  try {
    // Find all projects that have zero phases
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        project_phases(id)
      `);

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      process.exit(1);
    }

    // Filter projects with zero phases
    const projectsWithoutPhases = projects?.filter(project => 
      !project.project_phases || project.project_phases.length === 0
    ) || [];

    console.log(`📋 Found ${projectsWithoutPhases.length} projects without phases`);

    if (projectsWithoutPhases.length === 0) {
      console.log('✅ All projects already have phases. Nothing to seed.');
      process.exit(0);
    }

    // Process each project
    for (const project of projectsWithoutPhases) {
      console.log(`\n🚀 Seeding phases for project: ${project.name} (${project.id})`);

      // Create phases and tasks for this project
      for (let index = 0; index < defaultPhases.length; index++) {
        const phaseTemplate = defaultPhases[index];
        
        // Insert phase with order_index
        const { data: createdPhase, error: phaseError } = await supabase
          .from('project_phases')
          .insert({
            project_id: project.id,
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
          console.error(`❌ Error creating phase ${phaseTemplate.name}:`, phaseError);
          continue;
        }

        // Create tasks for each checklist item
        const tasks = phaseTemplate.checklist.map(checklistItem => ({
          project_id: project.id,
          phase_id: createdPhase.id,
          title: checklistItem,
          description: `${phaseTemplate.name} - ${checklistItem}`,
          status: 'todo' as const,
          priority: 'medium' as const
        }));

        if (tasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('tasks')
            .insert(tasks);

          if (tasksError) {
            console.error(`❌ Error creating tasks for phase ${phaseTemplate.name}:`, tasksError);
          }
        }
      }

      console.log(`✅ Seeded ${defaultPhases.length} phases for project: ${project.name}`);
    }

    console.log(`\n🎉 Seeding completed! Processed ${projectsWithoutPhases.length} projects.`);

  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding script
seedDefaultPhases();