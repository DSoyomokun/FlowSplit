/**
 * useUser Hook
 * Fetch and manage user profile with store integration
 *
 * Story 75: API hooks - useUser()
 */

import { useCallback, useEffect } from 'react';
import { useUserStore } from '@/stores';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';

interface UseUserReturn {
  user: ReturnType<typeof useUserStore>['user'];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
  updateProfile: (data: { full_name?: string; email?: string }) => Promise<boolean>;
}

export function useUser(): UseUserReturn {
  const store = useUserStore();
  const auth = useAuth();

  const fetchUser = useCallback(async () => {
    if (!auth.isAuthenticated) {
      store.clearUser();
      return;
    }

    try {
      store.setLoading(true);
      const userData = await api.getCurrentUser();
      store.setUser(userData);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to load user');
    }
  }, [auth.isAuthenticated, store]);

  // Fetch user when authenticated
  useEffect(() => {
    if (auth.isAuthenticated && !store.user && !store.isLoading) {
      fetchUser();
    }
  }, [auth.isAuthenticated, store.user, store.isLoading, fetchUser]);

  // Clear user when logged out
  useEffect(() => {
    if (!auth.isAuthenticated) {
      store.clearUser();
    }
  }, [auth.isAuthenticated, store]);

  const updateProfile = useCallback(
    async (data: { full_name?: string; email?: string }) => {
      try {
        store.setLoading(true);
        const updatedUser = await api.updateUser(data);
        store.setUser(updatedUser);
        return true;
      } catch (err) {
        store.setError(err instanceof Error ? err.message : 'Failed to update profile');
        return false;
      }
    },
    [store]
  );

  return {
    user: store.user,
    isLoading: store.isLoading,
    error: store.error,
    isAuthenticated: auth.isAuthenticated,
    refetch: fetchUser,
    updateProfile,
  };
}
