import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";
import { v4 as uuidv4 } from "https://deno.land/std@0.203.0/uuid/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function logFailure(detail: unknown) {
  try {
    await supabase
      .from("function_errors")
      .insert({
        id: uuidv4(),
        fn: "import_schedule_bulk",
        detail,
      });
  } catch (err) {
    console.error("Failed to log error:", err);
  }
}

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

    if (error || !data?.success) {
      const errorDetail = error ?? data;
      const errorMessage = error?.message ?? data?.error ?? "Import function failed";
      
      console.error("Import failed:", errorDetail);
      await logFailure(errorDetail);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorMessage,
          detail: errorDetail
        }),
        { 
          status: 200,  // Always return 200 to avoid edge function errors
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
    await logFailure(err);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: String(err),
        detail: err
      }),
      { 
        status: 200,  // Always return 200 to avoid edge function errors
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});