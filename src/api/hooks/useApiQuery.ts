import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../client/apiError';

export interface UseApiQueryOptions<T> {
  /** If false, query will not run automatically on mount */
  enabled?: boolean;
  /** Initial data before first response */
  initialData?: T;
  /** Callback fired on successful fetch */
  onSuccess?: (data: T) => void;
  /** Callback fired on error */
  onError?: (error: ApiError) => void;
}

export interface UseApiQueryResult<T> {
  data: T | undefined;
  error: ApiError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<T | undefined>;
}

/**
 * Reusable React hook for executing API GET queries with standardized loading and error state.
 */
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const { enabled = true, initialData, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);

  const execute = useCallback(async (): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : ApiError.fromAxiosError(err);
      setError(apiErr);
      onError?.(apiErr);
      return undefined;
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (enabled) {
      void execute();
    }
  }, [enabled, execute]);

  return {
    data,
    error,
    isLoading,
    isError: Boolean(error),
    isSuccess: !isLoading && !error && data !== undefined,
    refetch: execute,
  };
}
