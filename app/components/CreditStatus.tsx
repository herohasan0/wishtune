'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface CreditInfo {
  freeSongsUsed: number;
  freeSongsRemaining: number;
  paidCredits: number;
  totalSongsCreated: number;
}

export default function CreditStatus() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchCredits();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const hasFreeSongsRemaining = credits.totalSongsCreated < 2;
  const hasPaidCredits = credits.paidCredits > 0;
  const canCreate = hasFreeSongsRemaining || hasPaidCredits;

  return (
    <div className="mb-6 rounded-lg border border-[#F3E4D6] bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#2F1E14]">Your Credits</h3>
          <div className="mt-1 flex gap-4 text-xs text-[#8F6C54]">
            {hasFreeSongsRemaining && (
              <span>
                🎵 {2 - credits.totalSongsCreated} free song{2 - credits.totalSongsCreated !== 1 ? 's' : ''} remaining
              </span>
            )}
            {hasPaidCredits && (
              <span>
                💳 {credits.paidCredits} paid credit{credits.paidCredits !== 1 ? 's' : ''}
              </span>
            )}
            {!canCreate && (
              <span className="font-medium text-orange-600">
                ⚠️ No credits available
              </span>
            )}
          </div>
        </div>
        {!canCreate && (
          <Link
            href="/buy-credits"
            className="rounded-lg bg-[#8F6C54] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A5A45] transition-colors inline-block"
          >
            Buy Credits
          </Link>
        )}
      </div>
    </div>
  );
}

