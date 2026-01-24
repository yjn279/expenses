import { useState, useEffect, useCallback } from 'react';
import type { HouseholdData } from '../types';
import { fetchHouseholdData } from '../api/household';

/**
 * useHouseholdDataフックの戻り値の型
 */
interface UseHouseholdDataResult {
  /** 家計データ（読み込み中またはエラー時はnull） */
  data: HouseholdData | null;
  /** データ読み込み中かどうか */
  loading: boolean;
  /** エラーオブジェクト（エラーがない場合はnull） */
  error: Error | null;
  /** データを再取得する関数 */
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
