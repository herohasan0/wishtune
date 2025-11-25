import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function useFingerprint() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setVisitorId(result.visitorId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { visitorId, isLoading, error };
}
