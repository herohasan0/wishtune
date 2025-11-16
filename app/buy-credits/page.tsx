'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import Payment from '../components/Payment';

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
  const [selectedPlan, setSelectedPlan] = useState<CreditPackage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formResponse, setFormResponse] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    country: '',
    shippingContactName: '',
    billingContactName: '',
  });

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
      const response = await axios.get('/api/credits');
      setCredits(response.data.credits);
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/packages');
      console.log('📦 Packages fetched:', response.data);
      const packages = response.data.packages || [];
      console.log(`✅ Setting ${packages.length} packages`);
      setCreditPackages(packages);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setCreditPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setSelectedPlan(pkg);
    setShowForm(true);
    // Pre-fill email from session if available
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user.email || '' }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    
    // Split full name into name and surname
    const nameParts = formData.fullName.trim().split(/\s+/);
    const name = nameParts[0] || '';
    const surname = nameParts.slice(1).join(' ') || name; // Use first name as surname if only one word
    
    const data = {
      locale: "en",
      price: selectedPlan.price,
      paidPrice: selectedPlan.price,
      currency: "USD",
      callbackUrl: `${window.location.origin}/api/suno-callback`,
      buyer: {
        id: session?.user?.email?.replace(/[^a-zA-Z0-9]/g, '') || `BY${Date.now()}`,
        name: name,
        surname: surname,
        identityNumber: "11111111111",
        email: formData.email,
        gsmNumber: "+15551234567",
        registrationAddress: formData.address,
        city: formData.city,
        country: formData.country,
      },
      shippingAddress: {
        address: formData.address,
        contactName: formData.shippingContactName || formData.fullName,
        city: formData.city,
        country: formData.country
      },
      billingAddress: {
        address: formData.address,
        contactName: formData.billingContactName || formData.fullName,
        city: formData.city,
        country: formData.country
      },
      basketItems: [
        {
          id: selectedPlan.id,
          price: selectedPlan.price,
          name: selectedPlan.name,
          category1: "Credits",
          itemType: "VIRTUAL"
        }
      ]
    };

    try {
      const response = await axios.post("/api/initialize-form", data);
      setFormResponse(response.data?.checkoutFormContent);
      setShowForm(false);
    } catch (error) {
      console.error("Error initializing form:", error);
      alert("Failed to initialize payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPlan(null);
    setFormResponse(null);
    // Reset form data
    setFormData({
      fullName: '',
      email: session?.user?.email || '',
      address: '',
      city: '',
      country: '',
      shippingContactName: '',
      billingContactName: '',
    });
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

  // Show payment form if we have a response
  if (formResponse) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#FFF5EB] px-4 py-6 text-[#3F2A1F] sm:py-10">
        <BackgroundBlobs />
        <Header />
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8">
          <button
            onClick={handleCloseForm}
            className="flex items-center gap-2 self-start -ml-2 px-2 py-2 hover:opacity-70 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8F6C54]/30 bg-white/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F1E14]">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-[#2F1E14]">Back</span>
          </button>
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <Payment formResponse={formResponse} />
          </div>
        </div>
      </main>
    );
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
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all ${
                    pkg.popular
                      ? 'bg-[#F18A24] hover:bg-[#E07212]'
                      : 'bg-[#8F6C54] hover:bg-[#7A5A45]'
                  }`}
                >
                  Purchase
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

      {/* User Information Form Modal */}
      {showForm && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#F3E4D6] bg-white shadow-lg">
            <div className="sticky top-0 bg-white border-b border-[#F3E4D6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#2F1E14]">Complete Your Purchase</h2>
              <button
                onClick={handleCloseForm}
                className="text-[#8F6C54] hover:text-[#2F1E14] transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Selected Plan Info */}
              <div className="mb-6 rounded-lg border border-[#F3E4D6] bg-[#FFF5EB] p-4">
                <h3 className="text-lg font-semibold text-[#2F1E14]">{selectedPlan.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#F18A24]">${selectedPlan.price.toFixed(2)}</span>
                  <span className="text-sm text-[#8F6C54]">for {selectedPlan.credits} credits</span>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#2F1E14] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#2F1E14] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-[#2F1E14] mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-[#2F1E14] mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-[#2F1E14] mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full rounded-lg border border-[#F3E4D6] px-4 py-2 text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 rounded-lg border border-[#F3E4D6] px-4 py-3 text-sm font-semibold text-[#8F6C54] hover:bg-[#FFF5EB] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-[#F18A24] px-4 py-3 text-sm font-semibold text-white hover:bg-[#E07212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Continue to Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

