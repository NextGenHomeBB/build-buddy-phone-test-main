import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

interface TaskApprovalPayload {
  task_id: string
  approved_by: string
  approved_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: TaskApprovalPayload = await req.json()
    console.log('Task approval payload:', payload)

    // Get task details with approver info
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        project:projects(name),
        phase:project_phases(name),
        approver:profiles!tasks_approved_by_fkey(name)
      `)
      .eq('id', payload.task_id)
      .single()

    if (taskError) {
      console.error('Error fetching task:', taskError)
      return new Response(JSON.stringify({ error: taskError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get primary worker for notification
    const { data: primaryWorker, error: workerError } = await supabase
      .from('task_workers')
      .select(`
        user_id,
        user:profiles(name)
      `)
      .eq('task_id', payload.task_id)
      .eq('is_primary', true)
      .single()

    if (workerError) {
      console.error('Error fetching primary worker:', workerError)
    }

    // Send Slack notification
    const slackWebhook = Deno.env.get('SLACK_TASK_ASSIGN_WEBHOOK')
    if (slackWebhook) {
      const slackMessage = {
        text: `✅ Task Approved`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Task:* ${taskData.title}\n*Project:* ${taskData.project?.name || 'Unknown'}\n*Phase:* ${taskData.phase?.name || 'Unknown'}\n*Approved by:* ${taskData.approver?.name || 'Unknown'}\n*Primary Worker:* ${primaryWorker?.user?.name || 'Unknown'}`
            }
          }
        ]
      }

      try {
        const slackResponse = await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        })
        console.log('Slack approval notification sent:', slackResponse.status)
      } catch (slackError) {
        console.error('Slack approval notification failed:', slackError)
      }
    }

    // Send OneSignal push to primary worker
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY')
    
    if (oneSignalAppId && oneSignalApiKey && primaryWorker) {
      try {
        const pushData = {
          app_id: oneSignalAppId,
          include_external_user_ids: [primaryWorker.user_id],
          headings: { en: 'Task Approved!' },
          contents: { 
            en: `Your task "${taskData.title}" has been approved by ${taskData.approver?.name || 'manager'}` 
          },
          data: {
            task_id: payload.task_id,
            type: 'task_approval'
          }
        }

        const pushResponse = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${oneSignalApiKey}`
          },
          body: JSON.stringify(pushData)
        })
        
        console.log(`Approval push notification sent to ${primaryWorker.user_id}:`, pushResponse.status)
      } catch (pushError) {
        console.error(`Approval push notification failed:`, pushError)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})