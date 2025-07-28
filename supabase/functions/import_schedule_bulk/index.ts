// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";
import { v4 } from "https://deno.land/std@0.203.0/uuid/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function logFailure(detail: unknown) {
  console.error("Logging failure to function_errors:", detail);
  try {
    await supabase.from("function_errors").insert({
      id: v4.generate(),
      fn: "import_schedule_bulk",
      detail,
    });
  } catch (logError) {
    console.error("Failed to log error to function_errors:", logError);
  }
}

serve(async (req) => {
  console.log(`${req.method} ${req.url} - Import schedule request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Import schedule bulk request received");
    
    // Validate request has body
    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      console.error("Request has no body");
      throw new Error("Request body is required");
    }
    
    // Get request text first to handle JSON parsing errors better
    const requestText = await req.text();
    console.log("Raw request body:", requestText);
    
    if (!requestText || requestText.trim() === '') {
      console.error("Request body is empty");
      throw new Error("Request body is empty");
    }
    
    // Parse JSON with error handling
    let body;
    try {
      body = JSON.parse(requestText);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Request text that failed to parse:", requestText);
      throw new Error(`Invalid JSON: ${parseError.message}`);
    }
    
    // Validate required fields
    if (!body.workDate || !body.scheduleItems) {
      console.error("Missing required fields:", { workDate: !!body.workDate, scheduleItems: !!body.scheduleItems });
      throw new Error("Missing required fields: workDate and scheduleItems are required");
    }
    
    console.log("Parsed request payload:", JSON.stringify(body, null, 2));
    
    const { data, error } = await supabase
      .rpc("import_schedule_tx", { payload: body });

    console.log("Database function result:", { data, error });

    if (error || !data?.success) {
      const errorDetail = {
        database_error: error,
        function_result: data,
        request_payload: body,
        timestamp: new Date().toISOString()
      };
      
      console.error("Import failed with details:", errorDetail);
      await logFailure(errorDetail);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: error?.message ?? data?.error ?? "Unknown failure",
          detail: errorDetail,
          sql_error: error?.code ? `${error.code}: ${error.message}` : undefined
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Import successful:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (err) {
    const errorDetail = {
      error: err,
      error_message: String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error("Unhandled error:", errorDetail);
    await logFailure(errorDetail);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: String(err),
        detail: errorDetail
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});