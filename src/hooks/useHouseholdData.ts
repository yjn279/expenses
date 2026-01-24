import { useState, useEffect, useCallback } from 'react';
import type { HouseholdData } from '../types';
import { fetchHouseholdData } from '../api/household';

interface UseHouseholdDataResult {
  data: HouseholdData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useHouseholdData(): UseHouseholdDataResult {
  const [data, setData] = useState<HouseholdData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchHouseholdData();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch };
}
