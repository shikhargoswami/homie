import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService, Property, MatchStats } from '@services/matching.service';

/**
 * Matching Hook
 * 
 * Provides:
 * - Property recommendations
 * - Swipe functionality
 * - Match statistics
 * - Optimistic updates for instant UI feedback
 */

export const useRecommendations = (limit: number = 20) => {
  return useQuery<Property[]>({
    queryKey: ['recommendations', limit],
    queryFn: () => matchingService.getRecommendations(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSwipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, direction }: { propertyId: string; direction: 'right' | 'left' | 'super' }) =>
      matchingService.swipe(propertyId, direction),
    onSuccess: (data, variables) => {
      // Optimistically update recommendations (remove swiped property)
      queryClient.setQueryData<Property[]>(['recommendations'], (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== variables.propertyId);
      });

      // Invalidate stats to refetch
      queryClient.invalidateQueries({ queryKey: ['matchStats'] });

      // If mutual match, invalidate mutual matches
      if (data.data.isMutualMatch) {
        queryClient.invalidateQueries({ queryKey: ['mutualMatches'] });
      }
    },
  });
};

export const useMatchStats = () => {
  return useQuery<MatchStats>({
    queryKey: ['matchStats'],
    queryFn: () => matchingService.getStats(),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useMutualMatches = () => {
  return useQuery({
    queryKey: ['mutualMatches'],
    queryFn: () => matchingService.getMutualMatches(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
