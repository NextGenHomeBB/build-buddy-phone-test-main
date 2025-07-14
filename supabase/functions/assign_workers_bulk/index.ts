import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Assignment {
  taskId: string;
  userIds: string[];
  primaryId: string;
}

interface AssignmentRequest {
  assignments: Assignment[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assignments } = await req.json() as AssignmentRequest;
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Prepare all insert operations
    const insertOperations: any[] = [];
    const deleteOperations: string[] = [];

    for (const assignment of assignments) {
      // Collect task IDs for deletion
      deleteOperations.push(assignment.taskId);
      
      // Create insert records for each user
      for (const userId of assignment.userIds) {
        insertOperations.push({
          task_id: assignment.taskId,
          user_id: userId,
          is_primary: userId === assignment.primaryId
        });
      }
    }

    // Execute bulk operations in transaction
    const { error: deleteError } = await supabaseClient
      .from('task_workers')
      .delete()
      .in('task_id', deleteOperations);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }

    const { data, error: insertError } = await supabaseClient
      .from('task_workers')
      .insert(insertOperations)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Trigger notifications for assignments (batched)
    try {
      for (const assignment of assignments) {
        await supabaseClient.functions.invoke('notify_task_assignment', {
          body: {
            task_id: assignment.taskId,
            assigned_users: assignment.userIds,
            primary_user: assignment.primaryId
          }
        });
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the assignment for notification errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        assigned_count: data.length,
        assignments: assignments.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Bulk assignment error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to assign workers',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});