import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectSeedingService } from '@/services/projectSeedingService';
import { useToast } from '@/hooks/use-toast';

export function useProjectSeeding(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => projectSeedingService.seedProjectPhases(projectId),
    onSuccess: () => {
      // Invalidate and refetch project-related queries
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'phases'] });
      
      toast({
        title: "Phases created successfully",
        description: "All 29 default construction phases have been added to your project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create phases",
        description: error.message || "An error occurred while creating the phases.",
        variant: "destructive",
      });
    },
  });
}