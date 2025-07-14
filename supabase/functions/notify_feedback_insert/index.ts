import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      feedback: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          category: string
          title: string
          message: string
          attachment_url: string | null
          status: string
          external_issue_url: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(record.user_id)
    const userEmail = userData.user?.email || 'Unknown user'

    // Prepare notification payload
    const payload = {
      id: record.id,
      category: record.category,
      title: record.title,
      message: record.message.substring(0, 120),
      project_id: record.project_id,
      user_email: userEmail,
      created_at: record.created_at
    }

    console.log('Processing feedback notification:', payload)

    // Send to Slack if webhook URL is configured
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    if (slackWebhookUrl) {
      try {
        const slackPayload = {
          text: `New ${record.category} feedback received`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*New ${record.category} feedback from ${userEmail}*\n\n*Title:* ${record.title}\n*Message:* ${payload.message}${record.message.length > 120 ? '...' : ''}`
              }
            }
          ]
        }

        const slackResponse = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload)
        })

        if (slackResponse.ok) {
          console.log('Slack notification sent successfully')
        } else {
          console.error('Failed to send Slack notification:', await slackResponse.text())
        }
      } catch (error) {
        console.error('Error sending Slack notification:', error)
      }
    }

    // Create GitHub issue if token is configured
    const githubToken = Deno.env.get('GITHUB_TOKEN')
    const githubRepo = Deno.env.get('GITHUB_REPO') || 'feedback-repo'
    const githubOwner = Deno.env.get('GITHUB_OWNER') || 'feedback-owner'

    if (githubToken) {
      try {
        const githubPayload = {
          title: `[${record.category.toUpperCase()}] ${record.title}`,
          body: `**Submitted by:** ${userEmail}\n**Category:** ${record.category}\n**Project ID:** ${record.project_id || 'None'}\n\n**Description:**\n${record.message}`,
          labels: [`feedback/${record.category}`]
        }

        const githubResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/issues`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(githubPayload)
        })

        if (githubResponse.ok) {
          const issueData = await githubResponse.json()
          console.log('GitHub issue created successfully:', issueData.html_url)

          // Update feedback record with external issue URL
          await supabase
            .from('feedback')
            .update({ external_issue_url: issueData.html_url })
            .eq('id', record.id)

        } else {
          console.error('Failed to create GitHub issue:', await githubResponse.text())
        }
      } catch (error) {
        console.error('Error creating GitHub issue:', error)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error processing feedback notification:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})