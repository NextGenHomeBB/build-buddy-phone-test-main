import { supabase } from '@/integrations/supabase/client';

interface TaskData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  project_id: string;
  phase_id?: string;
  estimated_hours?: number;
}

interface WorkerAssignment {
  task_id: string;
  user_id: string;
  is_primary: boolean;
}

export async function seedTaskData() {
  try {
    console.log('Starting task seeding...');

    // Get the first project and phase for seeding
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);

    if (!projects || projects.length === 0) {
      console.log('No projects found. Please create a project first.');
      return;
    }

    const { data: phases } = await supabase
      .from('project_phases')
      .select('id, name')
      .eq('project_id', projects[0].id)
      .limit(1);

    const { data: users } = await supabase
      .from('profiles')
      .select('user_id, name')
      .limit(5);

    if (!users || users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    // Create demo tasks
    const demoTasks: TaskData[] = [
      {
        title: 'Setup foundation concrete',
        description: 'Pour concrete foundation according to architectural plans',
        priority: 'high',
        status: 'todo',
        project_id: projects[0].id,
        phase_id: phases?.[0]?.id,
        estimated_hours: 8
      },
      {
        title: 'Install electrical wiring',
        description: 'Install main electrical panel and wire first floor outlets',
        priority: 'medium',
        status: 'todo',
        project_id: projects[0].id,
        phase_id: phases?.[0]?.id,
        estimated_hours: 6
      },
      {
        title: 'Plumbing rough-in',
        description: 'Install plumbing lines for kitchen and bathrooms',
        priority: 'medium',
        status: 'in-progress',
        project_id: projects[0].id,
        phase_id: phases?.[0]?.id,
        estimated_hours: 4
      },
      {
        title: 'Frame interior walls',
        description: 'Frame all interior walls per floor plan',
        priority: 'urgent',
        status: 'completed',
        project_id: projects[0].id,
        phase_id: phases?.[0]?.id,
        estimated_hours: 12
      },
      {
        title: 'Install insulation',
        description: 'Install R-19 insulation in all exterior walls',
        priority: 'low',
        status: 'todo',
        project_id: projects[0].id,
        phase_id: phases?.[0]?.id,
        estimated_hours: 5
      }
    ];

    // Insert tasks
    const { data: insertedTasks, error: taskError } = await supabase
      .from('tasks')
      .insert(demoTasks)
      .select('id, title');

    if (taskError) {
      console.error('Error inserting tasks:', taskError);
      return;
    }

    console.log(`Created ${insertedTasks.length} demo tasks`);

    // Create worker assignments
    const assignments: WorkerAssignment[] = [];
    
    insertedTasks.forEach((task, index) => {
      // Assign primary worker (rotate through users)
      const primaryWorker = users[index % users.length];
      assignments.push({
        task_id: task.id,
        user_id: primaryWorker.user_id,
        is_primary: true
      });

      // Add assistant worker for some tasks
      if (index % 2 === 0 && users.length > 1) {
        const assistantWorker = users[(index + 1) % users.length];
        assignments.push({
          task_id: task.id,
          user_id: assistantWorker.user_id,
          is_primary: false
        });
      }
    });

    // Insert worker assignments
    const { error: assignmentError } = await supabase
      .from('task_workers')
      .insert(assignments);

    if (assignmentError) {
      console.error('Error inserting task assignments:', assignmentError);
      return;
    }

    console.log(`Created ${assignments.length} worker assignments`);
    console.log('Task seeding completed successfully!');

    return {
      tasks: insertedTasks,
      assignments: assignments.length
    };

  } catch (error) {
    console.error('Error seeding task data:', error);
    throw error;
  }
}

// Run if called directly
if (typeof window === 'undefined') {
  seedTaskData()
    .then((result) => {
      console.log('Seeding result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}