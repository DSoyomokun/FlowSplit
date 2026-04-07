import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import type { SplitTemplate } from '@/types';

export function useSplitTemplates() {
  const [templates, setTemplates] = useState<SplitTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getSplitTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, isLoading, error, refetch: fetchTemplates };
}
