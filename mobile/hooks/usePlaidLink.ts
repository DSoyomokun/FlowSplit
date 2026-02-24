import { useCallback, useState } from 'react';
import { create, open, dismissLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';
import * as api from '@/services/api';
import type { BankAccount } from '@/types';

export function usePlaidLink(onSuccess?: (accounts: BankAccount[]) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPlaidLink = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Get link token from our backend
      const { link_token } = await api.createLinkToken();

      // 2. Create the Plaid Link configuration
      create({ token: link_token });

      // 3. Open Plaid Link
      const handleSuccess = async (success: LinkSuccess) => {
        try {
          const metadata = success.metadata;
          const accounts = await api.exchangePublicToken({
            public_token: success.publicToken,
            institution_id: metadata.institution?.id ?? undefined,
            institution_name: metadata.institution?.name ?? undefined,
          });
          onSuccess?.(accounts);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to link account');
        } finally {
          setIsLoading(false);
        }
      };

      const handleExit = (exit: LinkExit) => {
        setIsLoading(false);
        if (exit.error) {
          setError(exit.error.displayMessage || exit.error.errorMessage || 'Plaid Link error');
        }
      };

      open({ onSuccess: handleSuccess, onExit: handleExit });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to start Plaid Link');
    }
  }, [onSuccess]);

  return {
    openPlaidLink,
    isLoading,
    error,
    dismissLink,
  };
}
