'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import Payment from '../components/Payment';
import { trackButtonClick, setupPageExitTracking, trackPurchase } from '../utils/analytics';

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
  const [selectedPlan, setSelectedPlan] = useState<CreditPackage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formResponse, setFormResponse] = useState<string | null>(null);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/');
    }
  }, [session, status, router]);

  // Track page engagement time
  useEffect(() => {
    return setupPageExitTracking('buy_credits_page');
  }, []);

  // Fetch credits using React Query
  const {
    data: creditsData,
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

  // Fetch packages using React Query
  const {
    data: packagesData,
    isLoading: packagesLoading,
  } = useQuery<{ packages: CreditPackage[] }>({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await axios.get<{ packages: CreditPackage[] }>('/api/packages');
      return response.data;
    },
    enabled: !!session?.user,
    retry: 1,
  });

  const creditPackages = packagesData?.packages ?? [];

  const handlePurchase = (pkg: CreditPackage) => {
    trackButtonClick('select_credit_package', '/buy-credits');
    trackPurchase(
      `pkg_${pkg.id}`,
      pkg.price,
      'USD',
      [{ name: pkg.name, quantity: 1, price: pkg.price }]
    );
    
    setSelectedPlan(pkg);
    setShowForm(true);
    // Pre-fill email from session if available
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user.email || '' }));
    }
  };

  // Payment type definitions
  interface PaymentBuyer {
    id: string;
    name: string;
    surname: string;
    identityNumber: string;
    email: string;
    gsmNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
  }

  interface PaymentAddress {
    address: string;
    contactName: string;
    city: string;
    country: string;
  }

  interface PaymentBasketItem {
    id: string;
    price: number;
    name: string;
    category1: string;
    itemType: string;
  }

  interface PaymentData {
    locale: string;
    price: number;
    paidPrice: number;
    currency: string;
    callbackUrl: string;
    buyer: PaymentBuyer;
    shippingAddress: PaymentAddress;
    billingAddress: PaymentAddress;
    basketItems: PaymentBasketItem[];
  }

  // Initialize payment form mutation
  const initializeFormMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      const response = await axios.post<{ checkoutFormContent: string }>("/api/initialize-form", data);
      return response.data;
    },
    onSuccess: (data) => {
      setFormResponse(data.checkoutFormContent);
      setShowForm(false);
    },
    onError: (error) => {
      console.error("Error initializing form:", error);
      alert("Failed to initialize payment. Please try again.");
    },
  });

  // Helper function to prepare payment data
  const preparePaymentData = (plan: CreditPackage) => {
    // Split full name into name and surname
    const nameParts = formData.fullName.trim().split(/\s+/);
    const name = nameParts[0] || '';
    const surname = nameParts.slice(1).join(' ') || name; // Use first name as surname if only one word
    
    return {
      locale: "en",
      price: plan.price,
      paidPrice: plan.price,
      currency: "USD",
      callbackUrl: `${window.location.origin}/api/payment-callback`,
      buyer: {
        id: session?.user?.email?.replace(/[^a-zA-Z0-9]/g, '') || `BY${Date.now()}`,
        name: name,
        surname: surname,
        identityNumber: "11111111111",
        email: session?.user?.email || '',
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
          id: plan.id,
          price: plan.price,
          name: plan.name,
          category1: "Credits",
          itemType: "VIRTUAL"
        }
      ]
    };
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    const data = preparePaymentData(selectedPlan);
    initializeFormMutation.mutate(data);
  };

  const handleSaveBillingAddress = () => {
    if (!selectedPlan) return;
    
    setIsEditingBilling(false);
    const data = preparePaymentData(selectedPlan);
    initializeFormMutation.mutate(data);
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

  if (status === 'loading' || packagesLoading) {
    return (
      <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
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
      <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
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
          
          {/* Billing Address Section */}
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <h2 className="text-sm font-semibold text-[#2F1E14]">Billing Address</h2>
              </div>
              {!isEditingBilling && (
                <button
                  onClick={() => setIsEditingBilling(true)}
                  className="flex items-center gap-1 text-xs font-medium text-[#F18A24] hover:text-[#E07212] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit
                </button>
              )}
            </div>
            
            {isEditingBilling ? (
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full rounded-lg border border-[#F3E4D6] px-3 py-2 text-sm text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-lg border border-[#F3E4D6] px-3 py-2 text-sm text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full rounded-lg border border-[#F3E4D6] px-3 py-2 text-sm text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded-lg border border-[#F3E4D6] px-3 py-2 text-sm text-[#2F1E14] focus:border-[#F18A24] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingBilling(false)}
                    className="flex-1 rounded-lg border border-[#F3E4D6] px-3 py-2 text-xs font-medium text-[#8F6C54] hover:bg-[#FFF5EB] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBillingAddress}
                    disabled={initializeFormMutation.isPending}
                    className="flex-1 rounded-lg bg-[#F18A24] px-3 py-2 text-xs font-medium text-white hover:bg-[#E07212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {initializeFormMutation.isPending ? 'Updating...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#2F1E14] space-y-1">
                <p>{formData.fullName || '-'}</p>
                <p className="text-[#8F6C54]">{session?.user?.email || '-'}</p>
                <p>{formData.address || '-'}</p>
                <p>{formData.city || '-'}, {formData.country || '-'}</p>
              </div>
            )}
          </div>
          
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <Payment formResponse={formResponse} />
          </div>
          
          {/* Trust Indicators */}
          <div className="rounded-lg border border-[#F3E4D6] bg-linear-to-r from-[#FFF5EB] to-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Security Badge */}
              <div className="flex items-center gap-2 text-[#2F1E14]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span className="text-lg font-semibold">Secure Payment</span>
              </div>
              
              {/* Trust Text */}
              <p className="text-sm text-[#8F6C54] max-w-md">
                Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data. Processed by heroicsoft.
              </p>
              
              {/* Security Features */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#8F6C54]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                  </svg>
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8F6C54]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                  </svg>
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8F6C54]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F18A24]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                  </svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
      <BackgroundBlobs />
      <Header />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Back Button */}
        <Link
          href="/account"
          className="flex items-center gap-2 self-start -ml-2 px-2 py-2 hover:opacity-70 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8F6C54]/30 bg-white/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F1E14]">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[#2F1E14]">My Account</span>
        </Link>

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
                    ? 'border-[#F18A24] bg-linear-to-br from-[#FFF5EB] to-white ring-2 ring-[#F18A24]/20'
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
        <div className="rounded-lg border border-[#F3E4D6] bg-linear-to-r from-[#FFF5EB] to-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-sm text-[#8F6C54] mb-2">
              Need more credits or have questions?
            </p>
            <a
              href="mailto:help@heroicsoft.com"
              className="inline-flex items-center gap-2 text-base font-semibold text-[#F18A24] hover:text-[#E07212] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              help@heroicsoft.com
            </a>
          </div>
        </div>

        {/* Info Section */}
        <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[#2F1E14]">How Credits Work</h3>
          <div className="space-y-3 text-sm text-[#8F6C54]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                <span className="text-xs">1</span>
              </div>
              <p>Each credit allows you to create one song with multiple variations</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                <span className="text-xs">2</span>
              </div>
              <p>Credits never expire - use them whenever you want</p>
            </div>
          </div>
        </div>

        {/* Back to Account */}
        <div className="text-center">
          <Link
            href="/account"
            className="text-sm font-medium text-[#8F6C54] hover:text-[#2F1E14] transition-colors inline-block"
          >
            ← Back to My Account
          </Link>
        </div>
      </div>

      {/* User Information Form Modal */}
      {showForm && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#F3E4D6] bg-white shadow-lg">
            <div className="p-6">
              {/* Selected Plan Info */}
              <div className="mb-6 rounded-lg border border-[#F3E4D6] bg-[#FFF5EB] p-4 relative">
                <button
                  onClick={handleCloseForm}
                  className="absolute top-4 right-4 text-[#8F6C54] hover:text-[#2F1E14] transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
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
                    disabled={initializeFormMutation.isPending}
                    className="flex-1 rounded-lg bg-[#F18A24] px-4 py-3 text-sm font-semibold text-white hover:bg-[#E07212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {initializeFormMutation.isPending ? 'Processing...' : 'Continue'}
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

