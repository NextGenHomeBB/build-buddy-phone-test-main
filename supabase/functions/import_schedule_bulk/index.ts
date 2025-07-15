// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";
import { v4 as uuidv4 } from "https://deno.land/std@0.203.0/uuid/mod.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function logFailure(detail: unknown) {
  console.error("Logging failure to function_errors:", detail);
  await supabase.from("function_errors").insert({
    id: uuidv4(),
    fn: "import_schedule_bulk",
    detail,
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      }
    });
  }

  try {
    console.log("Import schedule bulk request received");
    const body = await req.json();           // { workDate, scheduleItems }
    console.log("Request payload:", JSON.stringify(body, null, 2));
    
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
          status: 200,                                       // always 200
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log("Import successful:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
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
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});