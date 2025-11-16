'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';

interface CreditInfo {
  freeSongsUsed: number;
  freeSongsRemaining: number;
  paidCredits: number;
  totalSongsCreated: number;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  description: string;
}

export default function BuyCreditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/');
      return;
    }

    fetchCredits();
    fetchPackages();
  }, [session, status, router]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/packages');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Packages fetched:', data);
        const packages = data.packages || [];
        console.log(`✅ Setting ${packages.length} packages`);
        setCreditPackages(packages);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch packages:', response.status, errorData);
        setCreditPackages([]);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setCreditPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasing(pkg.id);
    
    // TODO: Implement actual payment processing
    // For now, this is a placeholder
    setTimeout(() => {
      alert(`Payment integration coming soon!\n\nPackage: ${pkg.name}\nCredits: ${pkg.credits}\nPrice: $${pkg.price.toFixed(2)}`);
      setPurchasing(null);
    }, 500);
  };

  if (status === 'loading' || loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#FFF5EB] px-4 py-6 text-[#3F2A1F] sm:py-10">
        <BackgroundBlobs />
        <Header />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-center py-20">
          <div className="text-center">
            <div className="mb-4 text-lg text-[#8F6C54]">Loading...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF5EB] px-4 py-6 text-[#3F2A1F] sm:py-10">
      <BackgroundBlobs />
      <Header />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/account')}
          className="flex items-center gap-2 self-start -ml-2 px-2 py-2 hover:opacity-70 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8F6C54]/30 bg-white/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F1E14]">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[#2F1E14]">My Account</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-[#2F1E14] sm:text-5xl">Buy Credits</h1>
          <p className="mt-2 text-[#8F6C54]">Purchase credits to create more songs</p>
        </div>

        {/* Current Credits Status */}
        {credits && (
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#2F1E14]">Your Current Credits</h2>
                <p className="mt-1 text-sm text-[#8F6C54]">
                  {credits.paidCredits > 0 
                    ? `You have ${credits.paidCredits} paid credit${credits.paidCredits !== 1 ? 's' : ''} available`
                    : 'You have no paid credits'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#2F1E14]">
                  {credits.paidCredits}
                </div>
                <div className="text-xs text-[#8F6C54]">credits</div>
              </div>
            </div>
          </div>
        )}

        {/* Credit Packages */}
        {creditPackages.length === 0 ? (
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm text-center">
            <p className="text-[#8F6C54]">No credit packages available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {creditPackages.map((pkg) => {
            const isPurchasing = purchasing === pkg.id;
            const pricePerCredit = (pkg.price / pkg.credits).toFixed(2);
            
            return (
              <div
                key={pkg.id}
                className={`relative rounded-lg border p-6 shadow-sm transition-all ${
                  pkg.popular
                    ? 'border-[#F18A24] bg-gradient-to-br from-[#FFF5EB] to-white ring-2 ring-[#F18A24]/20'
                    : 'border-[#F3E4D6] bg-white/95'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#F18A24] px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-[#2F1E14]">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-[#8F6C54]">{pkg.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-[#2F1E14]">
                      ${pkg.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#F18A24]">
                      {pkg.credits}
                    </span>
                    <span className="text-sm text-[#8F6C54]">credits</span>
                  </div>
                  <p className="mt-1 text-xs text-[#8F6C54]">
                    ${pricePerCredit} per credit
                  </p>
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isPurchasing}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all ${
                    pkg.popular
                      ? 'bg-[#F18A24] hover:bg-[#E07212]'
                      : 'bg-[#8F6C54] hover:bg-[#7A5A45]'
                  } ${isPurchasing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isPurchasing ? 'Processing...' : 'Purchase'}
                </button>
              </div>
            );
          })}
          </div>
        )}

        {/* Contact Section */}
        <div className="rounded-lg border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-sm text-[#8F6C54] mb-2">
              Need more credits or have questions?
            </p>
            <a
              href="mailto:wishtune@info.com"
              className="inline-flex items-center gap-2 text-base font-semibold text-[#F18A24] hover:text-[#E07212] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              wishtune@info.com
            </a>
          </div>
        </div>

        {/* Info Section */}
        <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[#2F1E14]">How Credits Work</h3>
          <div className="space-y-3 text-sm text-[#8F6C54]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                <span className="text-xs">1</span>
              </div>
              <p>Each credit allows you to create one song with multiple variations</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                <span className="text-xs">2</span>
              </div>
              <p>Credits never expire - use them whenever you want</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                <span className="text-xs">3</span>
              </div>
              <p>You get 2 free songs when you first sign up</p>
            </div>
          </div>
        </div>

        {/* Back to Account */}
        <div className="text-center">
          <button
            onClick={() => router.push('/account')}
            className="text-sm font-medium text-[#8F6C54] hover:text-[#2F1E14] transition-colors"
          >
            ← Back to My Account
          </button>
        </div>
      </div>
    </main>
  );
}

