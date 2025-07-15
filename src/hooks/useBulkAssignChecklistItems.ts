import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItemAssignment {
  projectChecklistId: string;
  itemId: string;
  userId: string;
}

export function useBulkAssignChecklistItems() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assignments }: { assignments: ChecklistItemAssignment[] }) => {
      console.log('🎯 Bulk assigning checklist items:', assignments);

      // Group assignments by project checklist ID
      const assignmentsByProjectChecklist = assignments.reduce((acc, assignment) => {
        if (!acc[assignment.projectChecklistId]) {
          acc[assignment.projectChecklistId] = [];
        }
        acc[assignment.projectChecklistId].push(assignment);
        return acc;
      }, {} as Record<string, ChecklistItemAssignment[]>);

      // Process each project checklist
      for (const [projectChecklistId, itemAssignments] of Object.entries(assignmentsByProjectChecklist)) {
        // Get current completed_items
        const { data: currentData, error: fetchError } = await supabase
          .from('project_checklists')
          .select('completed_items')
          .eq('id', projectChecklistId)
          .single();

        if (fetchError) throw fetchError;

        const completedItems = (currentData.completed_items as any) || {};

        // Update assignments for each item
        itemAssignments.forEach(({ itemId, userId }) => {
          if (!completedItems[itemId]) {
            completedItems[itemId] = {};
          }
          completedItems[itemId].assigned_to = userId;
          completedItems[itemId].assigned_at = new Date().toISOString();
        });

        // Update the project checklist with new assignments
        const { error: updateError } = await supabase
          .from('project_checklists')
          .update({
            completed_items: completedItems,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectChecklistId);

        if (updateError) throw updateError;
      }

      return { success: true, assignedCount: assignments.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Checklist Items Assigned",
        description: `Successfully assigned ${data.assignedCount} checklist items`,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['unassigned-checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['project-checklists'] });
    },
    onError: (error) => {
      console.error('❌ Error assigning checklist items:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign checklist items. Please try again.",
        variant: "destructive",
      });
    }
  });
}