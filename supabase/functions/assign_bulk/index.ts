import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkAssignPayload {
  workerId: string;
  taskIds: string[];
  checklistItemIds: string[];
  projectId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: BulkAssignPayload = await req.json();
    console.log('🎯 Processing bulk assignment:', payload);

    const { workerId, taskIds, checklistItemIds, projectId } = payload;

    // Validate input
    if (!workerId || (!taskIds.length && !checklistItemIds.length)) {
      throw new Error('Invalid payload: workerId and at least one task or checklist item required');
    }

    // Start transaction-like operations
    const operations = [];

    // 1. Assign tasks to worker in task_workers table
    if (taskIds.length > 0) {
      console.log(`📝 Assigning ${taskIds.length} tasks to worker ${workerId}`);
      
      for (const taskId of taskIds) {
        // Insert into task_workers (primary worker for first assignment)
        const { error: taskWorkerError } = await supabaseClient
          .from('task_workers')
          .insert({
            task_id: taskId,
            user_id: workerId,
            is_primary: true
          });

        if (taskWorkerError) {
          console.error('❌ Error inserting task worker:', taskWorkerError);
          throw taskWorkerError;
        }

        // Update task assigned_to field for backward compatibility
        const { error: taskUpdateError } = await supabaseClient
          .from('tasks')
          .update({ assigned_to: workerId })
          .eq('id', taskId);

        if (taskUpdateError) {
          console.error('❌ Error updating task assigned_to:', taskUpdateError);
          throw taskUpdateError;
        }
      }
    }

    // 2. Assign checklist items
    if (checklistItemIds.length > 0) {
      console.log(`📋 Assigning ${checklistItemIds.length} checklist items to worker ${workerId}`);
      
      const { error: checklistError } = await supabaseClient
        .from('checklist_items')
        .update({ assignee_id: workerId })
        .in('id', checklistItemIds);

      if (checklistError) {
        console.error('❌ Error assigning checklist items:', checklistError);
        throw checklistError;
      }
    }

    // 3. Get project and worker details for notification
    const { data: project } = await supabaseClient
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    const { data: worker } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('user_id', workerId)
      .single();

    // 4. Send notification (basic implementation)
    console.log(`🔔 Assignment completed: ${worker?.name || workerId} assigned ${taskIds.length} tasks and ${checklistItemIds.length} checklist items in ${project?.name || projectId}`);

    // TODO: Implement push notifications and Slack integration here
    // await sendPushNotification(workerId, `You have been assigned ${taskIds.length} tasks and ${checklistItemIds.length} checklist items in ${project?.name}`);
    // await sendSlackMessage(`${worker?.name} assigned ${taskIds.length} tasks (${checklistItemIds.length} checklists) in ${project?.name}.`);

    return new Response(
      JSON.stringify({
        success: true,
        assigned: {
          tasks: taskIds.length,
          checklistItems: checklistItemIds.length,
          worker: worker?.name || workerId,
          project: project?.name || projectId
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Bulk assignment error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
})