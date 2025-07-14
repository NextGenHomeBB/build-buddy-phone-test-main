import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

interface TaskAssignmentPayload {
  task_id: string
  user_id: string
  is_primary: boolean
  schedule_context?: {
    address: string
    date: string
    category: string
  }
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

    const payload: TaskAssignmentPayload = await req.json()
    console.log('Task assignment payload:', payload)

    // Get task details with project and phase info
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        project:projects(name),
        phase:project_phases(name)
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

    // Get all assignees for this task
    const { data: assignees, error: assigneesError } = await supabase
      .from('task_workers')
      .select(`
        user_id,
        is_primary,
        user:profiles(name)
      `)
      .eq('task_id', payload.task_id)

    if (assigneesError) {
      console.error('Error fetching assignees:', assigneesError)
    }

    const assigneeNames = assignees?.map(a => a.user?.name || 'Unknown').join(', ') || 'Unknown'

    // Send Slack notification
    const slackWebhook = Deno.env.get('SLACK_TASK_ASSIGN_WEBHOOK')
    if (slackWebhook) {
      let messageText = `*Task:* ${taskData.title}\n*Project:* ${taskData.project?.name || 'Unknown'}\n*Phase:* ${taskData.phase?.name || 'Unknown'}\n*Assignees:* ${assigneeNames}`
      
      if (payload.schedule_context) {
        messageText += `\n\n📍 *Schedule Details:*\n*Location:* ${payload.schedule_context.address}\n*Time:* ${payload.schedule_context.date}\n*Category:* ${payload.schedule_context.category}`
      }

      const slackMessage = {
        text: `🔧 Task Assigned from Schedule`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: messageText
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
        console.log('Slack notification sent:', slackResponse.status)
      } catch (slackError) {
        console.error('Slack notification failed:', slackError)
      }
    }

    // Send OneSignal push notification
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY')
    
    if (oneSignalAppId && oneSignalApiKey && assignees) {
      for (const assignee of assignees) {
        try {
          let notificationContent = `You've been assigned to: ${taskData.title}${assignee.is_primary ? ' (Primary)' : ''}`
          
          if (payload.schedule_context) {
            notificationContent += `\n📍 ${payload.schedule_context.address} at ${payload.schedule_context.date}`
          }

          const pushData = {
            app_id: oneSignalAppId,
            include_external_user_ids: [assignee.user_id],
            headings: { en: 'New Task Assignment from Schedule' },
            contents: { 
              en: notificationContent
            },
            data: {
              task_id: payload.task_id,
              type: 'task_assignment',
              schedule_context: payload.schedule_context
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
          
          console.log(`Push notification sent to ${assignee.user_id}:`, pushResponse.status)
        } catch (pushError) {
          console.error(`Push notification failed for ${assignee.user_id}:`, pushError)
        }
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