import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Import schedule bulk request received");
    
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    if (!body.workDate || !body.scheduleItems) {
      throw new Error("Missing required fields: workDate and scheduleItems");
    }

    const { data, error } = await supabase
      .rpc("import_schedule_tx", { payload: body });

    console.log("Database function result:", { data, error });

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          detail: error 
        }),
        { 
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    if (!data || !data.success) {
      console.error("Function returned error:", data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data?.error || "Import function failed",
          detail: data 
        }),
        { 
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    console.log("Import successful:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });

  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error",
        detail: String(err) 
      }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});