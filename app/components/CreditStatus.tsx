'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { forwardRef } from 'react';

interface CreditInfo {
  paidCredits: number;
  totalSongsCreated: number;
}

interface CreditStatusProps {
  showError?: boolean;
}

const CreditStatus = forwardRef<HTMLDivElement, CreditStatusProps>(({ showError = false }, ref) => {
  const { data: session } = useSession();

  // Use React Query to fetch credits (shares cache with other components)
  const {
    data: creditsData,
    isLoading: loading,
  } = useQuery<{ credits: CreditInfo }>({
    queryKey: ['credits'],
    queryFn: async () => {
      const response = await axios.get<{ credits: CreditInfo }>('/api/credits');
      return response.data;
    },
    enabled: !!session?.user,
    retry: 1,
  });

  const credits = creditsData?.credits ?? null;

  // Show loading skeleton to prevent layout shift
  if (!session || loading) {
    return (
      <div className="mb-6 rounded-lg border border-[#F3E4D6] bg-white/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#2F1E14]">Your Credits</h3>
            <div className="mt-1 flex gap-4 text-xs">
              <div className="h-4 w-32 animate-pulse rounded bg-[#F3E4D6]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  const hasCredits = credits.paidCredits > 0;
  const showNoCreditsError = showError && !hasCredits;

  return (
    <div
      ref={ref}
      className={`mb-6 rounded-lg border p-4 shadow-sm transition-all ${
        showNoCreditsError
          ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
          : 'border-[#F3E4D6] bg-white/95'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#2F1E14]">Your Credits</h3>
          <div className="mt-1 flex gap-4 text-xs text-[#8F6C54]">
            {hasCredits ? (
              <span>
                💳 {credits.paidCredits} credit{credits.paidCredits !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className={`font-medium ${showNoCreditsError ? 'text-red-600' : 'text-orange-600'}`}>
                ⚠️ No credits available
              </span>
            )}
          </div>
          {showNoCreditsError && (
            <p className="mt-2 text-xs font-medium text-red-600">
              ❌ You need credits to create songs. Please buy credits to continue.
            </p>
          )}
        </div>
        {!hasCredits && (
          <Link
            href="/buy-credits"
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors inline-block ${
              showNoCreditsError
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#8F6C54] hover:bg-[#7A5A45]'
            }`}
          >
            Buy Credits
          </Link>
        )}
      </div>
    </div>
  );
});

CreditStatus.displayName = 'CreditStatus';

export default CreditStatus;
