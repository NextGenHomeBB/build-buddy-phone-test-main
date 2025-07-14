import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const slackWebhook = Deno.env.get('SLACK_TASK_DONE_WEBHOOK')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse the request body
    const body = await req.json()
    const { task_id } = body

    if (!task_id) {
      return new Response(
        JSON.stringify({ error: 'task_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Notifying task completion for task: ${task_id}`)

    // Get task details with related data
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        project_id,
        phase_id,
        assigned_to,
        projects!inner(name),
        project_phases(name),
        profiles!tasks_assigned_to_fkey(name)
      `)
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      console.error('Error fetching task details:', taskError)
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare Slack notification payload
    const slackPayload = {
      task_id: task.id,
      title: task.title,
      worker: task.profiles?.name || 'Unknown',
      phase: task.project_phases?.name || 'No Phase',
      project: task.projects.name,
      completed_at: new Date().toISOString()
    }

    // Send to Slack if webhook is configured
    if (slackWebhook) {
      try {
        const slackResponse = await fetch(slackWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `✅ Task Completed`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Task Completed* ✅\n*Project:* ${slackPayload.project}\n*Phase:* ${slackPayload.phase}\n*Task:* ${slackPayload.title}\n*Worker:* ${slackPayload.worker}`
                }
              }
            ]
          })
        })

        if (!slackResponse.ok) {
          console.error('Failed to send Slack notification:', await slackResponse.text())
        } else {
          console.log('Slack notification sent successfully')
        }
      } catch (slackError) {
        console.error('Error sending Slack notification:', slackError)
      }
    } else {
      console.log('Slack webhook not configured, skipping notification')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Task completion processed',
        payload: slackPayload 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})