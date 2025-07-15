import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ImportSchedulePayload {
  workDate: string;
  scheduleItems: Array<{
    address: string;
    category?: string;
    startTime: string;
    endTime: string;
    workers: string[];
  }>;
}

interface ImportScheduleResult {
  success: boolean;
  schedule_id?: string;
  created_projects?: number;
  created_workers?: number;
  error?: string;
}

export function useImportSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ImportSchedulePayload): Promise<ImportScheduleResult> => {
      console.log("Calling import_schedule_bulk with payload:", payload);
      
      try {
        const { data, error } = await supabase.functions.invoke(
          "import_schedule_bulk",
          { 
            body: payload,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        console.log("Edge function response:", { data, error });

        if (error) {
          console.error("Edge function error:", error);
          // Enhanced error handling for different types of failures
          if (error.message?.includes('Failed to send a request')) {
            throw new Error(`Network error: Unable to connect to import service. Please check your connection and try again.`);
          }
          throw new Error(error.message || "Failed to call import function");
        }

        // Handle business logic errors returned with status 200
        if (!data?.success) {
          console.error("Import failed:", data);
          const errorDetails = data?.detail || {};
          const errorMessage = data?.message || data?.error || "Import failed";
          
          // Create enhanced error object with details
          const enhancedError = new Error(errorMessage) as Error & { detail?: any; sql_error?: string };
          enhancedError.detail = errorDetails;
          enhancedError.sql_error = data?.sql_error;
          
          throw enhancedError;
        }

        return data;
      } catch (networkError) {
        console.error("Network or invocation error:", networkError);
        // Re-throw with enhanced error information
        if (networkError instanceof Error) {
          throw networkError;
        }
        throw new Error("Unexpected error during import operation");
      }
    },
    onSuccess: (data) => {
      console.log("Import successful:", data);
      
      toast({
        title: "Schedule imported successfully",
        description: `Created ${data.created_projects || 0} projects and ${data.created_workers || 0} workers`,
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-workers'] });
    },
    onError: (error: Error & { detail?: any; sql_error?: string }) => {
      console.error("Import error:", error);
      
      // Extract more detailed error information
      const errorMessage = error.message || "Import failed";
      const sqlError = error.sql_error;
      const hasDetailedError = error.detail?.database_error || error.detail?.function_result;
      
      let description = errorMessage;
      if (sqlError) {
        description = `SQL Error: ${sqlError}`;
      } else if (hasDetailedError) {
        const dbError = error.detail.database_error;
        if (dbError?.message) {
          description = `Database Error: ${dbError.message}`;
        }
      }
      
      toast({
        title: "Schedule import failed",
        description,
        variant: "destructive",
      });
    },
  });
}