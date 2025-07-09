import { useQuery, QueryKey } from '@tanstack/react-query';

export function useOfflineQuery<T>(
  key: QueryKey,
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    retry?: boolean | number;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    retry: options?.retry ?? 2,
    networkMode: 'offlineFirst',
    ...options
  });
}