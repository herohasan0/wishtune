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

  // Load credits from API
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (session?.user) {
      fetchCredits();
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

  const canCreateSong = credits 
    ? (credits.freeSongsRemaining > 0 || credits.paidCredits > 0)
    : true; // Allow first song before sign-in

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

  // Show form if user can create songs or hasn't signed in yet
  const showForm = !session || canCreateSong;
  const showSignUpPrompt = session && !canCreateSong;

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
