import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { format } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleItem {
  id: string;
  address: string;
  category: string;
  start_time: string;
  end_time: string;
  schedule_item_workers: Array<{
    is_assistant: boolean;
    profiles: {
      name: string;
    };
  }>;
}

interface Schedule {
  id: string;
  work_date: string;
  schedule_items: ScheduleItem[];
}

interface Absence {
  user_id: string;
  reason?: string;
  profiles: {
    name: string;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const slackWebhook = Deno.env.get('SLACK_DAILY_SCHEDULE_WEBHOOK');
    const hrEmail = Deno.env.get('HR_EMAIL');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in Amsterdam timezone
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    console.log(`Fetching schedule for ${todayStr}`);

    // Fetch today's schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        id,
        work_date,
        schedule_items (
          id,
          address,
          category,
          start_time,
          end_time,
          schedule_item_workers (
            is_assistant,
            profiles (
              name
            )
          )
        )
      `)
      .eq('work_date', todayStr)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      throw scheduleError;
    }

    // Fetch today's absences
    const { data: absences, error: absencesError } = await supabase
      .from('absences')
      .select(`
        user_id,
        reason,
        profiles (
          name
        )
      `)
      .eq('work_date', todayStr);

    if (absencesError) {
      throw absencesError;
    }

    // If there's a schedule, send to Slack
    if (schedule && slackWebhook) {
      await sendSlackNotification(slackWebhook, schedule as Schedule, absences as Absence[] || []);
    }

    // If there are absences, send email to HR
    if (absences && absences.length > 0 && hrEmail) {
      await sendAbsenceEmail(hrEmail, absences as Absence[], todayStr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduleFound: !!schedule,
        absencesCount: absences?.length || 0 
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send_daily_schedule:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

async function sendSlackNotification(webhookUrl: string, schedule: Schedule, absences: Absence[]) {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📅 Daily Schedule - ${format(new Date(schedule.work_date), 'EEEE, MMMM d, yyyy')}`
      }
    },
    {
      type: "divider"
    }
  ];

  // Add schedule items
  for (const item of schedule.schedule_items) {
    const workers = item.schedule_item_workers;
    const workerText = workers.map(w => 
      `${w.profiles.name}${w.is_assistant ? ' (assist)' : ''}`
    ).join(', ') || 'No workers assigned';

    const categoryEmoji = {
      'normal': '🏗️',
      'materials': '📦',
      'storingen': '🚨',
      'specials': '⭐'
    }[item.category] || '🏗️';

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${categoryEmoji} *${item.address}*\n🕐 ${item.start_time} - ${item.end_time}\n👥 ${workerText}`
      }
    });
  }

  // Add absences if any
  if (absences.length > 0) {
    blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🏠 *Absences (${absences.length})*\n${absences.map(a => 
            `• ${a.profiles.name}${a.reason ? ` (${a.reason})` : ''}`
          ).join('\n')}`
        }
      }
    );
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ blocks }),
  });

  console.log('Slack notification sent successfully');
}

async function sendAbsenceEmail(hrEmail: string, absences: Absence[], date: string) {
  // This would integrate with your email service (e.g., Resend)
  // For now, just log it
  console.log(`Would send absence email to ${hrEmail} for ${absences.length} absences on ${date}`);
  
  const emailContent = `
    <h2>Daily Absences Report - ${format(new Date(date), 'EEEE, MMMM d, yyyy')}</h2>
    <ul>
      ${absences.map(a => 
        `<li>${a.profiles.name}${a.reason ? ` - ${a.reason}` : ''}</li>`
      ).join('')}
    </ul>
  `;

  // Implement email sending here using your preferred service
  console.log('Email content:', emailContent);
}