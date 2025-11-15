'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import NameInput from './components/NameInput';
import CelebrationTypeSelector from './components/CelebrationTypeSelector';
import MusicStyleSelector from './components/MusicStyleSelector';
import SignUpPrompt from './components/SignUpPrompt';
import SignInPrompt from './components/SignInPrompt';
import CreateButton from './components/CreateButton';
import CreditStatus from './components/CreditStatus';
import Footer from './components/Footer';
import Divider from './components/Divider';

interface CreditInfo {
  freeSongsUsed: number;
  freeSongsRemaining: number;
  paidCredits: number;
  totalSongsCreated: number;
}

export default function Home() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [name, setName] = useState('');
  const [celebrationType, setCelebrationType] = useState('birthday');
  const [selectedStyle, setSelectedStyle] = useState('pop');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [nameError, setNameError] = useState(false);
  const [songsCreatedCount, setSongsCreatedCount] = useState<number>(0);

  // Check localStorage for songs created count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = localStorage.getItem('wishtune_songs_created');
      setSongsCreatedCount(count ? parseInt(count, 10) : 0);
    }
  }, []);

  // Load credits from API and merge anonymous song if needed
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (session?.user) {
      // Merge anonymous song if user had one before login
      const mergeAnonymousSong = async () => {
        if (typeof window !== 'undefined') {
          const count = localStorage.getItem('wishtune_songs_created');
          if (count === '1') {
            try {
              await fetch('/api/merge-anonymous-song', { method: 'POST' });
              // Keep localStorage as 1, user can create one more
            } catch (error) {
              console.error('Error merging anonymous song:', error);
            }
          }
        }
      };
      
      mergeAnonymousSong().then(() => {
        fetchCredits();
      });
    } else {
      setCreditsLoading(false);
    }
  }, [session, sessionStatus]);

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
      setCreditsLoading(false);
    }
  };

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
    { id: 'holiday', label: 'Holiday', icon: '❄️' },
    { id: 'just-because', label: 'Just Because', icon: '✨' },
  ];

  const musicStyles = [
    { id: 'pop', label: 'Pop', description: 'Upbeat & Catchy', icon: '🎵' },
    { id: 'rock', label: 'Rock', description: 'Energetic & Fun', icon: '🚗' },
    { id: 'lullaby', label: 'Lullaby', description: 'Soft & Soothing', icon: '🎹' },
    { id: 'folk', label: 'Folk', description: 'Acoustic & Heartfelt', icon: '🎸' },
  ];

  const handleCreate = async () => {
    // Check if name is missing
    if (!name.trim()) {
      setNameError(true);
      // Smooth scroll to the name input
      const nameInput = document.getElementById('name');
      nameInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => nameInput?.focus(), 500);
      return;
    }
    
    // Clear any previous error
    setNameError(false);
    
    if (celebrationType && selectedStyle) {
      setIsLoading(true);
      
      try {
        // Call Suno AI API route
        const response = await fetch('/api/create-song', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            celebrationType: celebrationType,
            musicStyle: selectedStyle,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create song');
        }

        const newSong = await response.json();
        
        // Track song creation count
        if (typeof window !== 'undefined') {
          const currentCount = parseInt(localStorage.getItem('wishtune_songs_created') || '0', 10);
          const newCount = currentCount + 1;
          localStorage.setItem('wishtune_songs_created', newCount.toString());
          setSongsCreatedCount(newCount);
          
          // If user is logged in and this is their second song, save to database
          if (session?.user && newCount === 2) {
            try {
              await fetch('/api/save-song-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: 2 }),
              });
            } catch (error) {
              console.error('Error saving song count to database:', error);
            }
          }
        }
        
        // Refresh credits after song creation
        if (session?.user) {
          await fetchCredits();
        }
        
        // Navigate to songs page with song data
        router.push(`/songs?data=${encodeURIComponent(JSON.stringify(newSong))}`);
      } catch (error) {
        console.error('Error creating song:', error);
        alert(error instanceof Error ? error.message : 'Failed to create song. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Show form if user can create songs
  const showForm = canCreate;
  // Show sign-in prompt if count is 1 and user is not logged in
  const showSignInPrompt = !session && songsCreatedCount === 1;
  // Show sign-up prompt if logged in but can't create (need credits)
  const showSignUpPrompt = session && !canCreate;

  return (
    <main className="flex min-h-screen flex-col bg-[#FDF7F0] text-[#2F1E14]">
      <Header />

      <section className="flex flex-1 flex-col px-4 pb-16 pt-8 sm:px-6">
        <HeroSection />

        <div className="mx-auto mt-8 w-full max-w-3xl">
          {session && <CreditStatus />}
          
          <div className="rounded-[36px] border border-[#F3E4D6] bg-white/95 p-6 shadow-[0_25px_80px_rgba(207,173,138,0.25)] sm:p-10 md:p-12">
            {showForm ? (
              <>
                <NameInput
                  name={name}
                  nameError={nameError}
                  onNameChange={(value) => {
                    setName(value);
                    setNameError(false);
                  }}
                />

                <Divider />

                <CelebrationTypeSelector
                  celebrationTypes={celebrationTypes}
                  selectedType={celebrationType}
                  onSelect={setCelebrationType}
                />

                <Divider />

                <MusicStyleSelector
                  musicStyles={musicStyles}
                  selectedStyle={selectedStyle}
                  onSelect={setSelectedStyle}
                />
              </>
            ) : showSignInPrompt ? (
              <SignInPrompt />
            ) : (
              <SignUpPrompt />
            )}
          </div>

          {showForm && (
            <CreateButton isLoading={isLoading} onClick={handleCreate} />
          )}

          <Footer />
        </div>
      </section>
    </main>
  );
}
