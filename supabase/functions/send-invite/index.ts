import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: 'admin' | 'manager' | 'worker';
  message?: string;
  organization_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, role, message, organization_id }: InviteRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Try to invite the user through Supabase Auth
    const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          role,
          organization_id: organization_id || null
        },
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:5173'}/dashboard`
      }
    );

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      throw new Error(`Failed to invite user: ${inviteError.message}`);
    }

    console.log("User invited successfully:", inviteData);

    // If we have organization_id and user was created, set custom claims
    if (organization_id && inviteData.user) {
      try {
        const claimsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/setCustomClaims`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            uid: inviteData.user.id,
            organization_id,
            role
          })
        });

        if (!claimsResponse.ok) {
          console.error("Failed to set custom claims:", await claimsResponse.text());
        } else {
          console.log("Custom claims set successfully");
        }
      } catch (claimsError) {
        console.error("Error setting custom claims:", claimsError);
        // Don't fail the invitation if claims setting fails
      }
    }

    let existingUser = null;

    let emailSubject = "You're invited to join our team!";
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; margin-bottom: 20px;">Team Invitation</h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have been invited to join our team as a <strong>${role}</strong>.
          </p>
          
          ${message ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p style="color: #333; margin: 0; font-style: italic;">"${message}"</p>
            </div>
          ` : ''}
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            To get started, please contact your administrator to set up your account.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Your Role:</h3>
            <p style="color: #666; margin: 0; font-weight: bold; text-transform: capitalize;">${role}</p>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    if (existingUser) {
      emailSubject = "You've been added to a new team!";
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #333; margin-bottom: 20px;">Welcome to the Team!</h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hi ${existingUser.name || 'there'},
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You have been added to our team with the role of <strong>${role}</strong>.
            </p>
            
            ${message ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff;">
                <p style="color: #333; margin: 0; font-style: italic;">"${message}"</p>
              </div>
            ` : ''}
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You can now access the system with your existing account.
            </p>
          </div>
        </div>
      `;
    }

    console.log("Sending invitation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Team Invitation <onboarding@resend.dev>",
      to: [email],
      subject: emailSubject,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the invitation
    await supabaseClient
      .from('function_errors')
      .insert({
        fn: 'send-invite',
        detail: {
          email,
          role,
          organization_id,
          message: message || 'Default invitation message',
          timestamp: new Date().toISOString(),
          success: true,
          user_id: inviteData?.user?.id
        }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invitation sent successfully",
      emailId: emailResponse.data?.id,
      user: inviteData?.user
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    
    // Log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('function_errors')
        .insert({
          fn: 'send-invite',
          detail: {
            error: error.message,
            timestamp: new Date().toISOString(),
            success: false
          }
        });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);