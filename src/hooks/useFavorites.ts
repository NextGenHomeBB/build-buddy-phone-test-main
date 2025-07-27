import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '@/services/favoritesService';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesService.getUserFavorites(),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (materialId: string) => favoritesService.toggleMaterialFavorite(materialId),
    onSuccess: (result, materialId) => {
      toast({
        title: result.isFavorite ? "Added to favorites" : "Removed from favorites",
        description: result.isFavorite ? "Material added to your favorites" : "Material removed from your favorites",
      });
      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = (materialId: string) => {
    toggleFavoriteMutation.mutate(materialId);
  };

  const isFavorite = (materialId: string) => {
    return favoriteIds.includes(materialId);
  };

  return {
    favoriteIds,
    isLoading,
    toggleFavorite,
    isFavorite,
    isToggling: toggleFavoriteMutation.isPending,
  };
};