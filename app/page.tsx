'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import NameInput from './components/NameInput';
import CelebrationTypeSelector from './components/CelebrationTypeSelector';
import MusicStyleSelector from './components/MusicStyleSelector';
import SignUpPrompt from './components/SignUpPrompt';
import CreateButton from './components/CreateButton';
import Footer from './components/Footer';
import Divider from './components/Divider';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [celebrationType, setCelebrationType] = useState('birthday');
  const [selectedStyle, setSelectedStyle] = useState('pop');
  const [isLoading, setIsLoading] = useState(false);
  const [songsCreated, setSongsCreated] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [nameError, setNameError] = useState(false);

  // Load songs created count from localStorage
  useEffect(() => {
    const loadSongsCount = () => {
      setIsClient(true);
      const count = parseInt(localStorage.getItem('wishtune_songs_created') || '0', 10);
      setSongsCreated(count);
    };
    loadSongsCount();
  }, []);

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
        
        // Increment songs created count in localStorage
        const newCount = songsCreated + 1;
        localStorage.setItem('wishtune_songs_created', newCount.toString());
        setSongsCreated(newCount);
        
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

  // Don't render until we've checked localStorage on client
  if (!isClient) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#FDF7F0] text-[#2F1E14]">
      <Header />

      <section className="flex flex-1 flex-col px-4 pb-16 pt-8 sm:px-6">
        <HeroSection />

        <div className="mx-auto mt-8 w-full max-w-3xl">
          <div className="rounded-[36px] border border-[#F3E4D6] bg-white/95 p-6 shadow-[0_25px_80px_rgba(207,173,138,0.25)] sm:p-10 md:p-12">
            {songsCreated === 0 ? (
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

          {songsCreated === 0 && (
            <CreateButton isLoading={isLoading} onClick={handleCreate} />
          )}

          <Footer />
        </div>
      </section>
    </main>
  );
}
