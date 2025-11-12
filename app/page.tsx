'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CelebrationGrid from './components/CelebrationGrid';

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
    { id: 'birthday', label: '🎂 Birthday', description: 'Happy birthday wishes' },
    { id: 'anniversary', label: '💕 Anniversary', description: 'Celebrate love and milestones' },
    { id: 'wedding', label: '💒 Wedding', description: 'Special day celebration' },
    { id: 'graduation', label: '🎓 Graduation', description: 'Achievement and success' },
    { id: 'baby', label: '👶 New Baby', description: 'Welcome the little one' },
    { id: 'retirement', label: '🎉 Retirement', description: 'New beginnings' },
  ];

  const musicStyles = [
    { id: 'pop', label: '🎵 Pop', description: 'Upbeat and catchy' },
    { id: 'classical', label: '🎹 Classical', description: 'Elegant and timeless' },
    { id: 'jazz', label: '🎷 Jazz', description: 'Smooth and sophisticated' },
    { id: 'rock', label: '🎸 Rock', description: 'Energetic and fun' },
    { id: 'lullaby', label: '🌙 Lullaby', description: 'Gentle and soothing' },
    { id: 'disco', label: '✨ Disco', description: 'Groovy and fun' },
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
      
      // Simulate API call to Suno AI
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Create the song with 3 variations
      const newSong = {
        id: Date.now().toString(),
        name: name.trim(),
        celebrationType: celebrationType,
        style: selectedStyle,
        createdAt: new Date().toISOString(),
        variations: [
          {
            id: `${Date.now()}-1`,
            title: 'Version 1',
            duration: '2:45',
          },
          {
            id: `${Date.now()}-2`,
            title: 'Version 2',
            duration: '3:12',
          },
          {
            id: `${Date.now()}-3`,
            title: 'Version 3',
            duration: '2:58',
          },
        ],
      };
      
      // Increment songs created count in localStorage
      const newCount = songsCreated + 1;
      localStorage.setItem('wishtune_songs_created', newCount.toString());
      setSongsCreated(newCount);
      
      // Navigate to songs page with song data
      router.push(`/songs?data=${encodeURIComponent(JSON.stringify(newSong))}`);
    }
  };

  // Don't render until we've checked localStorage on client
  if (!isClient) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative">
      <CelebrationGrid />
      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-main-text mb-2 sm:mb-4">
            🎉 WishTune
          </h1>
          <p className="text-lg sm:text-xl text-main-text/70">
            Create a special song for your celebration
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border-3 sm:border-4 border-accent-3/30">
          {songsCreated === 0 ? (
            // Show creation form for first free song
            <>
              {/* Name Input */}
              <div className="mb-6 sm:mb-8">
                <label 
                  htmlFor="name" 
                  className="block text-xl sm:text-2xl font-semibold text-main-text mb-2 sm:mb-3"
                >
                  Who is this song for?
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(false);
                  }}
                  placeholder="Enter a name..."
                  className={`w-full px-4 py-3 sm:px-6 sm:py-4 text-lg sm:text-xl rounded-xl sm:rounded-2xl border-3 focus:outline-none focus:ring-4 transition-all text-main-text placeholder:text-main-text/40 ${
                    nameError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-primary/20 focus:border-primary focus:ring-primary/20'
                  }`}
                />
                {nameError && (
                  <p className="mt-2 text-red-500 text-sm sm:text-base font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Name is required to create a song
                  </p>
                )}
              </div>

              {/* Celebration Type Selection */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-xl sm:text-2xl font-semibold text-main-text mb-3 sm:mb-4">
                  What are we celebrating?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {celebrationTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setCelebrationType(type.id)}
                      className={`p-4 rounded-xl border-3 transition-all active:scale-95 flex flex-col items-center justify-center text-center ${
                        celebrationType === type.id
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <div className="text-3xl sm:text-4xl mb-2">
                        {type.label.split(' ')[0]}
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-main-text mb-1">
                        {type.label.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="text-xs sm:text-sm text-main-text/60">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div className="mb-8 sm:mb-10">
                <label className="block text-xl sm:text-2xl font-semibold text-main-text mb-3 sm:mb-4">
                  Choose a music style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {musicStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-xl border-3 transition-all active:scale-95 flex flex-col items-center justify-center text-center ${
                        selectedStyle === style.id
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <div className="text-3xl sm:text-4xl mb-2">
                        {style.label.split(' ')[0]}
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-main-text mb-1">
                        {style.label.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="text-xs sm:text-sm text-main-text/60">
                        {style.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-bold text-white transition-all transform bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                  !isLoading ? 'active:scale-95 cursor-pointer' : 'cursor-wait'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  name.trim() && celebrationType && selectedStyle
                    ? `🎵 Create Song for ${name}`
                    : '🎵 Create Song'
                )}
              </button>
            </>
          ) : (
            // Show sign up options after free song is used
            <>
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                  <span className="text-5xl">🎵</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-main-text mb-3">
                  Sign up to create more songs
                </h2>
                <p className="text-lg text-main-text/70">
                  Join thousands of users creating personalized songs for every special moment.
                </p>
              </div>
              
              <div className="space-y-3 max-w-md mx-auto">
                {/* Sign up with Google */}
                <button
                  onClick={() => console.log('Sign up with Google')}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all transform active:scale-95 shadow-sm"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </button>

                {/* Sign up with Email */}
                <button
                  onClick={() => console.log('Sign up with Email')}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 bg-primary text-white hover:bg-primary/90 transition-all transform active:scale-95 shadow-sm"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Sign up with Email
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-main-text/50 mt-6 sm:mt-8 text-sm px-4">
          Perfect for birthdays, celebrations, and special moments
        </p>
      </div>
    </main>
  );
}
