import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * 
 * Why React Query?
 * - Automatic caching (reduces API calls)
 * - Background refetching (always fresh data)
 * - Optimistic updates (instant UI feedback)
 * - Error handling (automatic retries)
 * - Loading states (no manual useState)
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 3 times
      retry: 3,
      
      // Exponential backoff: 1s, 2s, 4s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (user returns to app)
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect (user regains internet)
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});
