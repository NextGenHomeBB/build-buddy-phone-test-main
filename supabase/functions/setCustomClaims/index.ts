import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetCustomClaimsRequest {
  uid: string;
  organization_id: string;
  role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { uid, organization_id, role = 'worker' }: SetCustomClaimsRequest = await req.json();

    if (!uid || !organization_id) {
      return new Response(
        JSON.stringify({ error: "uid and organization_id are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Setting custom claims for user ${uid}: org=${organization_id}, role=${role}`);

    // Update user metadata with organization_id and role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      uid,
      {
        user_metadata: {
          organization_id,
          role
        }
      }
    );

    if (error) {
      console.error('Error setting custom claims:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Custom claims set successfully:', data);

    return new Response(JSON.stringify({ ok: true, user: data.user }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in setCustomClaims function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to set custom claims" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);