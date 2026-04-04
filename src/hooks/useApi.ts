import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => void;
}

export function useApi<T>(fetchFn: () => Promise<T>, deps: unknown[] = []): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
    lastFetched: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null, lastFetched: new Date() });
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.message ?? 'Unknown error';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
