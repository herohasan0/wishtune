'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import NameInput from './components/NameInput';
import CelebrationTypeSelector from './components/CelebrationTypeSelector';
import MusicStyleSelector from './components/MusicStyleSelector';
import DurationSelector from './components/DurationSelector';
import SignUpPrompt from './components/SignUpPrompt';
import SignInPrompt from './components/SignInPrompt';
import CreateButton from './components/CreateButton';
import CreditStatus from './components/CreditStatus';
import Footer from './components/Footer';
import Divider from './components/Divider';
import { trackSongCreationStep, trackFormSubmit, trackError, setupPageExitTracking } from './utils/analytics';

interface CreditInfo {
  paidCredits: number;
  totalSongsCreated: number;
}

import { useFingerprint } from './hooks/useFingerprint';

export default function Home() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const { visitorId } = useFingerprint();
  const [name, setName] = useState('');
  const [celebrationType, setCelebrationType] = useState('birthday');
  const [selectedStyle, setSelectedStyle] = useState('pop');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [nameError, setNameError] = useState(false);
  const [songsCreatedCount, setSongsCreatedCount] = useState<number>(0);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showCreditError, setShowCreditError] = useState(false);
  const creditStatusRef = useRef<HTMLDivElement>(null);


  // Fetch credits using React Query
  const {
    data: creditsData,
    isLoading: creditsLoading,
    refetch: refetchCredits,
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

  // Merge anonymous song mutation
  const mergeAnonymousSongMutation = useMutation({
    mutationFn: async () => {
      if (!visitorId) return;
      const response = await axios.post('/api/merge-anonymous-song', { visitorId });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate credits query to refetch after merge
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });

  // Check localStorage for songs created count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = localStorage.getItem('wishtune_songs_created');
      setSongsCreatedCount(count ? parseInt(count, 10) : 0);
    }
  }, []);

  // Track page engagement time
  useEffect(() => {
    return setupPageExitTracking('home_page');
  }, []);

  // Check for payment success in URL and refresh credits
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        setShowPaymentSuccess(true);
        // Refresh credits using React Query
        refetchCredits();
        // Remove query parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
        // Message will stay visible until user closes it manually
      }
    }
  }, [session, refetchCredits]);

  // Check anonymous status from server
  const { data: anonymousStatus } = useQuery({
    queryKey: ['anonymousStatus', visitorId],
    queryFn: async () => {
      if (!visitorId) return null;
      const response = await axios.get<{ used: boolean }>(`/api/check-anonymous-status?visitorId=${visitorId}`);
      return response.data;
    },
    enabled: !!visitorId && !session?.user,
  });

  // Load credits from API and merge anonymous song if needed
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (session?.user) {
      // Merge anonymous song if user had one before login
      if (typeof window !== 'undefined') {
        const count = localStorage.getItem('wishtune_songs_created');
        if (count === '1' && !mergeAnonymousSongMutation.isPending && !mergeAnonymousSongMutation.isSuccess) {
          mergeAnonymousSongMutation.mutate();
        }
      }
    } else if (anonymousStatus?.used) {
      // If server says used, update local state to reflect that
      setSongsCreatedCount(1);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishtune_songs_created', '1');
      }
    }
  }, [session, sessionStatus, mergeAnonymousSongMutation, anonymousStatus]);

  // Determine if user can create a song
  const canCreateSong = () => {
    // If not logged in
    if (!session?.user) {
      // Allow first song if count is 0
      return songsCreatedCount === 0;
    }
    
    // If logged in, check credits and localStorage count
    if (credits) {
      // Allow if total songs created < 2 OR has paid credits
      // Also check localStorage to ensure consistency
      const localCount = typeof window !== 'undefined' ? parseInt(localStorage.getItem('wishtune_songs_created') || '0', 10) : 0;
      const dbCount = credits.totalSongsCreated;
      // Use the higher of the two counts to be safe
      const effectiveCount = Math.max(localCount, dbCount);
      return effectiveCount < 2 || credits.paidCredits > 0;
    }
    
    // If credits not loaded yet, allow (will be checked on server)
    return true;
  };

  const canCreate = canCreateSong();

  const celebrationTypes = [
    { id: 'birthday', label: 'Birthday', icon: '🎂' },
    { id: 'graduation', label: 'Graduation', icon: '🎓' },
    { id: 'anniversary', label: 'Anniversary', icon: '💕' },
    { id: 'just-because', label: 'Just Because', icon: '✨' },
    { id: 'christmas', label: 'Christmas', icon: '🎄' },
    { id: 'new-year', label: 'New Year', icon: '🎉' },
  ];

  const musicStyles = [
    { id: 'pop', label: 'Pop', description: 'Upbeat & Catchy', icon: '🎵' },
    { id: 'rock', label: 'Rock', description: 'Energetic & Fun', icon: '🚗' },
    { id: 'lullaby', label: 'Lullaby', description: 'Soft & Soothing', icon: '🎹' },
    { id: 'folk', label: 'Folk', description: 'Acoustic & Heartfelt', icon: '🎸' },
    { id: 'jazz', label: 'Jazz', description: 'Energetic & Fun', icon: '🎷' },
    { id: 'classical', label: 'Classical', description: 'Classical & Elegant', icon: '🎻' },
  ];

  const durationOptions = [
    { id: 30, label: 'Short', description: '30-90 Seconds', icon: '⚡' },
    { id: 90, label: 'Long', description: '90-150 Seconds', icon: '🎼' },
  ];

  // Create song mutation
  const createSongMutation = useMutation({
    mutationFn: async (data: { name: string; celebrationType: string; musicStyle: string; duration: number }) => {
      const response = await axios.post('/api/create-song', {
        name: data.name.trim(),
        celebrationType: data.celebrationType,
        musicStyle: data.musicStyle,
        duration: data.duration,
        visitorId,
      });
      return response.data;
    },
    onSuccess: (newSong) => {
      // Credits and localStorage count will be updated when song is successfully created (status = 'complete')
      // This happens in the songs page when the song becomes complete

      trackFormSubmit('song_creation', true);

      // Redirect all users (both logged-in and anonymous) to /account
      const targetPage = '/account';

      // Store song data in sessionStorage instead of URL to keep URL clean
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('wishtune_new_song', JSON.stringify(newSong));

          // Use window.location.href for full page navigation to ensure sessionStorage is available
          window.location.href = targetPage;
        } catch (error) {
          console.error('❌ Error storing song data:', error);
          // Fallback: try to navigate anyway
          router.push(targetPage);
        }
      } else {
        // Fallback to router.push if window is not available (shouldn't happen in browser)
        router.push(targetPage);
      }
    },
    onError: (error) => {
      console.error('❌ Song creation error:', error);
      trackFormSubmit('song_creation', false);
      trackError('song_creation_error', error instanceof Error ? error.message : 'Unknown error');

      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        const status = error.response.status;

        // Handle rate limit errors (429)
        if (status === 429) {
          if (errorData.code === 'SUNO_RATE_LIMIT') {
            alert('🎵 High demand right now!\n\nOur song generation service is experiencing high traffic. Please wait a few seconds and try again.');
          } else {
            alert('⏸️ Please slow down!\n\nYou\'re creating songs too quickly. Wait a moment and try again.');
          }
        } else {
          // Other API errors
          alert(errorData.error || 'Failed to create song. Please try again.');
        }
      } else {
        console.error('Unknown Error:', error);
        alert(error instanceof Error ? error.message : 'Failed to create song. Please try again.');
      }
    },
  });

  const handleCreate = () => {
    // Check if name is missing
    if (!name.trim()) {
      setNameError(true);
      trackError('validation_error', 'Name field empty on create');
      // Smooth scroll to the name input
      const nameInput = document.getElementById('name');
      nameInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => nameInput?.focus(), 500);
      return;
    }

    // Check if logged-in user has credits
    if (session?.user && credits && credits.paidCredits === 0) {
      // No credits available - show error and scroll to credit status
      setShowCreditError(true);
      trackError('validation_error', 'No credits available');

      // Scroll to credit status
      creditStatusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Clear error after 5 seconds
      setTimeout(() => setShowCreditError(false), 5000);
      return;
    }

    // For anonymous users, ensure visitorId is available
    if (!session?.user && !visitorId) {
      alert('Please wait a moment while we set things up...');
      trackError('validation_error', 'VisitorId not ready for anonymous user');
      return;
    }

    // Clear any previous errors
    setNameError(false);
    setShowCreditError(false);

    if (celebrationType && selectedStyle) {
      trackSongCreationStep('create_clicked', {
        celebration_type: celebrationType,
        music_style: selectedStyle,
        duration: selectedDuration,
      });

      createSongMutation.mutate({
        name: name.trim(),
        celebrationType: celebrationType,
        musicStyle: selectedStyle,
        duration: selectedDuration,
      });
    }
  };

  // Show form if user can create songs
  const showForm = canCreate;
  // Show sign-in prompt if count is 1 and user is not logged in
  const showSignInPrompt = !session && songsCreatedCount === 1;
  // Show loading skeleton when checking credits for logged-in users
  const showFormLoading = session?.user && creditsLoading;

  return (
    <main className="flex min-h-screen flex-col text-[#2F1E14]">
      <Header />

      <section className="flex flex-1 flex-col px-4 pb-16 pt-8 sm:px-6">
        <HeroSection />

        <div className="mx-auto mt-8 w-full max-w-3xl">
          {/* Payment Success Message */}
          {showPaymentSuccess && (
            <div className="mb-6 rounded-lg border-2 border-green-500 bg-green-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">Payment Successful!</h3>
                  <p className="text-sm text-green-700">Your credits have been added to your account. You can now create songs!</p>
                </div>
                <button
                  onClick={() => setShowPaymentSuccess(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {session && <CreditStatus ref={creditStatusRef} showError={showCreditError} />}
          
          <div className="rounded-[36px] border border-[#F3E4D6] bg-white/95 p-6 shadow-[0_25px_80px_rgba(207,173,138,0.25)] sm:p-10 md:p-12">
            {showFormLoading ? (
              <>
                {/* Loading skeleton for Name Input */}
                <div className="space-y-3">
                  <div className="h-4 w-48 animate-pulse rounded bg-[#F3E4D6]"></div>
                  <div className="h-4 w-32 animate-pulse rounded bg-[#F3E4D6]"></div>
                  <div className="h-14 w-full animate-pulse rounded-full bg-[#F3E4D6]"></div>
                </div>

                <Divider />

                {/* Loading skeleton for Celebration Type Selector */}
                <div>
                  <div className="h-4 w-56 animate-pulse rounded bg-[#F3E4D6]"></div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-transparent bg-[#FDF8F3] px-4 py-4"
                      >
                        <div className="h-8 w-8 animate-pulse rounded bg-[#F3E4D6]"></div>
                        <div className="h-4 w-16 animate-pulse rounded bg-[#F3E4D6]"></div>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Loading skeleton for Music Style Selector */}
                <div>
                  <div className="h-4 w-40 animate-pulse rounded bg-[#F3E4D6]"></div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-transparent bg-[#FFF8F1] px-5 py-5"
                      >
                        <div className="h-6 w-6 animate-pulse rounded bg-[#F3E4D6]"></div>
                        <div className="h-4 w-12 animate-pulse rounded bg-[#F3E4D6]"></div>
                        <div className="h-3 w-20 animate-pulse rounded bg-[#F3E4D6]"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : showForm ? (
              <>
                <NameInput
                  name={name}
                  nameError={nameError}
                  onNameChange={(value) => {
                    setName(value);
                    setNameError(false);
                    if (value.trim()) {
                      trackSongCreationStep('name_entered');
                    }
                  }}
                />

                <Divider />

                <CelebrationTypeSelector
                  celebrationTypes={celebrationTypes}
                  selectedType={celebrationType}
                  onSelect={(type) => {
                    setCelebrationType(type);
                    trackSongCreationStep('celebration_selected', { celebration_type: type });
                  }}
                />

                <Divider />

                <MusicStyleSelector
                  musicStyles={musicStyles}
                  selectedStyle={selectedStyle}
                  onSelect={(style) => {
                    setSelectedStyle(style);
                    trackSongCreationStep('style_selected', { music_style: style });
                  }}
                />

                <Divider />

                <DurationSelector
                  isAuthenticated={session !== null} 
                  durations={durationOptions}
                  selectedDuration={selectedDuration}
                  onSelect={(duration) => {
                    setSelectedDuration(duration);
                    trackSongCreationStep('duration_selected', { duration: duration });
                  }}
                />
              </>
            ) : showSignInPrompt ? (
              <SignInPrompt />
            ) : (
              <SignUpPrompt />
            )}
          </div>

          {showForm && !showFormLoading && (
            <CreateButton
              isLoading={createSongMutation.isPending}
              onClick={handleCreate}
              creditCost={session?.user && credits ? 1 : undefined}
              disabled={session?.user && credits ? credits.paidCredits === 0 : false}
              disabledText="⚠️ Insufficient Credits"
            />
          )}

          <Footer />
        </div>
      </section>
    </main>
  );
}
