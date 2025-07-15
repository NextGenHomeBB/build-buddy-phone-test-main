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
      
      const { data, error } = await supabase.functions.invoke(
        "import_schedule_bulk",
        { body: payload }
      );
      
      console.log("Edge function response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to call import function");
      }

      if (!data?.success) {
        console.error("Import failed:", data);
        throw new Error(data?.error || "Import failed");
      }

      return data;
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
    onError: (error: Error) => {
      console.error("Import error:", error);
      
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}