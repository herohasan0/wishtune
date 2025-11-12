'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CelebrationGrid from '../components/CelebrationGrid';

interface SongVariation {
  id: string;
  title: string;
  duration: string;
}

interface Song {
  id: string;
  name: string;
  celebrationType?: string;
  style: string;
  createdAt: string;
  variations: SongVariation[];
}

export default function SongsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [song, setSong] = useState<Song | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Load song from URL params
    const songData = searchParams.get('data');
    if (songData) {
      try {
        const parsedSong = JSON.parse(decodeURIComponent(songData));
        setSong(parsedSong);
      } catch (error) {
        console.error('Error parsing song data:', error);
        router.push('/');
      }
    } else {
      // No song data, redirect to home
      router.push('/');
    }
  }, [searchParams, router]);

  const celebrationTypeLabels: Record<string, string> = {
    birthday: '🎂 Birthday',
    anniversary: '💕 Anniversary',
    wedding: '💒 Wedding',
    graduation: '🎓 Graduation',
    baby: '👶 New Baby',
    retirement: '🎉 Retirement',
  };

  const musicStyleLabels: Record<string, string> = {
    pop: '🎵 Pop',
    classical: '🎹 Classical',
    jazz: '🎷 Jazz',
    rock: '🎸 Rock',
    lullaby: '🌙 Lullaby',
    disco: '✨ Disco',
  };

  const handleShare = async (songId: string, variationId: string) => {
    const shareUrl = `${window.location.origin}/songs/${songId}/${variationId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my WishTune song!',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        copyToClipboard(shareUrl, variationId);
      }
    } else {
      copyToClipboard(shareUrl, variationId);
    }
  };

  const copyToClipboard = (text: string, variationId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(variationId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDownload = (songName: string, variationTitle: string) => {
    // Simulate download - in production, this would download the actual audio file
    const fileName = `${songName}-${variationTitle}.mp3`;
    console.log(`Downloading: ${fileName}`);
    
    // Create a mock download
    const link = document.createElement('a');
    link.download = fileName;
    link.click();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative">
      <CelebrationGrid />
      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-main-text mb-2 sm:mb-4">
            🎵 Your Songs
          </h1>
          <p className="text-lg sm:text-xl text-main-text/70">
            All your created celebration songs
          </p>
        </div>

        {/* Songs List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border-3 sm:border-4 border-accent-3/30">
          {!song ? (
            <div className="text-center py-12">
              <p className="text-2xl text-main-text/60 mb-4">Loading...</p>
            </div>
          ) : (
            <div>
              {/* Song Header */}
              <div className="mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-main-text mb-2">
                  Song for {song.name}
                </h3>
                <div className="flex items-center flex-wrap gap-3 text-main-text/60">
                  {song.celebrationType && (
                    <>
                      <span className="text-lg">{celebrationTypeLabels[song.celebrationType] || song.celebrationType}</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="text-lg">{musicStyleLabels[song.style] || song.style}</span>
                  <span>•</span>
                  <span>{new Date(song.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Song Variations */}
              <div className="space-y-3">
                {song.variations.map((variation) => (
                  <div
                    key={variation.id}
                    className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🎵</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-main-text">
                            {variation.title}
                          </h4>
                          <p className="text-sm text-main-text/60">
                            Duration: {variation.duration}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-semibold text-sm"
                          title="Play song"
                        >
                          ▶ Play
                        </button>
                        <button
                          onClick={() => handleShare(song.id, variation.id)}
                          className="px-4 py-2 bg-white text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-all font-semibold text-sm"
                          title="Share song"
                        >
                          {copiedId === variation.id ? '✓ Copied!' : '🔗 Share'}
                        </button>
                        <button
                          onClick={() => handleDownload(song.name, variation.title)}
                          className="px-4 py-2 bg-white text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-all font-semibold text-sm"
                          title="Download song"
                        >
                          ⬇ Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign Up Section */}
          <div className="mt-8 pt-6 border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-main-text text-center mb-6">
              Sign up to create more songs
            </h2>
            
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
          </div>
        </div>
      </div>
    </main>
  );
}

