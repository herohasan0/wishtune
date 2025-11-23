'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import SongsHeroSection from '../components/SongsHeroSection';
import PendingStatusBanner from '../components/PendingStatusBanner';
import LoadingState from '../components/LoadingState';
import SongVariationCard from '../components/SongVariationCard';
import SignUpSection from '../components/SignUpSection';
import { useSongPolling } from '../hooks/useSongPolling';
import { celebrationTypeLabels } from '../utils/constants';
import { setupPageExitTracking, trackSongCreationStep, trackButtonClick } from '../utils/analytics';

interface SongVariation {
  id: string;
  title: string;
  duration: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  status?: string;
}

interface Song {
  id: string;
  name: string;
  celebrationType?: string;
  style: string;
  createdAt: string;
  variations: SongVariation[];
  taskId?: string;
  status?: string;
  message?: string;
}

function SongsPageContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [song, setSong] = useState<Song | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingVariationId, setPlayingVariationId] = useState<string | null>(null);
  const [creditDeducted, setCreditDeducted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isProcessingRef = useRef(false);

  // Save song mutation
  const saveSongMutation = useMutation({
    mutationFn: async (songData: Song) => {
      const response = await axios.post('/api/songs/save', songData);
      return response.data;
    },
  });

  // Deduct credit mutation
  const deductCreditMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/deduct-credit', {});
      return response.data;
    },
    onSuccess: () => {
      // Invalidate credits query to refetch updated credits
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });

  // Save song count mutation
  const saveSongCountMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await axios.post('/api/save-song-count', { count });
      return response.data;
    },
  });

  useEffect(() => {
    // Mark as mounted to avoid hydration mismatch
    setIsMounted(true);
    
    // Read from sessionStorage after mount (client-side only)
    if (typeof window !== 'undefined') {
      const songData = sessionStorage.getItem('wishtune_new_song');
      if (songData) {
        try {
          const parsedSong = JSON.parse(songData);
          setSong(parsedSong);
          // Clear sessionStorage after reading
          sessionStorage.removeItem('wishtune_new_song');
          // Reset credit deducted flag for new song
          setCreditDeducted(false);
        } catch (error) {
          sessionStorage.removeItem('wishtune_new_song');
          router.push('/');
        }
      } else {
        // No song data, redirect to home
        router.push('/');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track page engagement time
  useEffect(() => {
    return setupPageExitTracking('songs_page');
  }, []);

  const handleShare = async (songId: string, variationId: string, audioUrl?: string, songName?: string) => {
    trackButtonClick('share_song', '/songs');
    const shareUrl = `${window.location.origin}/songs/${songId}/${variationId}`;

    // Check if we can share files (for Instagram/social media)
    if (navigator.share && audioUrl) {
      try {
        // Try to share the audio file directly (works on mobile for Instagram)
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const fileName = `${songName || 'WishTune'}-song.mp3`;
        const file = new File([blob], fileName, { type: 'audio/mpeg' });

        // Check if file sharing is supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${songName || 'WishTune'} - Custom Song`,
            text: 'Check out this custom song I created with WishTune!',
            files: [file],
          });
          return;
        }
      } catch {
        // File sharing failed, fall through to URL sharing
      }

      // Fallback to URL sharing
      try {
        await navigator.share({
          title: 'Check out my WishTune song!',
          text: 'Listen to this custom song I created!',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or error occurred
      }
    }

    // Final fallback: copy to clipboard
    copyToClipboard(shareUrl, variationId);
  };

  const copyToClipboard = (text: string, variationId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(variationId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDownload = async (songName: string, variationTitle: string, audioUrl?: string) => {
    trackButtonClick('download_song', '/songs');

    if (!audioUrl) {
      alert('Audio not available for download yet.');
      return;
    }

    const fileName = `${songName}-${variationTitle}.mp3`;

    try {
      // Fetch the audio file and create a blob for download
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback to opening in new tab if fetch fails
      window.open(audioUrl, '_blank');
    }
  };

  const handlePlayStateChange = (variationId: string, isPlaying: boolean) => {
    setPlayingVariationId(isPlaying ? variationId : null);
  };

  const handleSongUpdate = (updatedSong: Song) => {
    setSong(updatedSong);
  };

  // Save song to database and deduct credit when it becomes complete
  useEffect(() => {
    if (!song || song.status !== 'complete' || creditDeducted || isProcessingRef.current) {
      return;
    }

    // Check if all variations are ready
    const allVariationsReady = song.variations.every(
      (v) => v.status === 'complete' && v.audioUrl
    );

    if (allVariationsReady) {
      // Set processing flag immediately to prevent duplicate calls
      isProcessingRef.current = true;
      setCreditDeducted(true);

      const saveSongAndDeductCredit = async () => {
        try {
          // Track song completion
          trackSongCreationStep('song_completed', {
            celebration_type: song.celebrationType,
            music_style: song.style,
            variations_count: song.variations.length,
          });
          
          // Save song to database and deduct credit (only if logged in)
          if (session?.user) {
            // Save song first
            await saveSongMutation.mutateAsync(song);
            
            // Deduct 1 credit for the song (regardless of variations)
            await deductCreditMutation.mutateAsync();
            
            // Update localStorage count after successful credit deduction
            if (typeof window !== 'undefined') {
              const currentCount = parseInt(localStorage.getItem('wishtune_songs_created') || '0', 10);
              const newCount = currentCount + 1;
              localStorage.setItem('wishtune_songs_created', newCount.toString());
              
              // If user has reached 2 songs total, save count to database
              if (newCount >= 2) {
                try {
                  await saveSongCountMutation.mutateAsync(newCount);
                } catch (error) {}
              }
            }
          } else {
            // For anonymous users, update localStorage count (1 song = 1 count, regardless of variations)
            if (typeof window !== 'undefined') {
              const currentCount = parseInt(localStorage.getItem('wishtune_songs_created') || '0', 10);
              const newCount = currentCount + 1;
              localStorage.setItem('wishtune_songs_created', newCount.toString());
            }
          }
        } catch (error) {
          // Reset flags on error so user can retry if needed
          isProcessingRef.current = false;
          setCreditDeducted(false);
        }
      };

      saveSongAndDeductCredit();
    }
  }, [song, session, creditDeducted]);

  // Poll for song status if pending
  const isPolling = useSongPolling({
    song,
    onSongUpdate: handleSongUpdate,
  });

  const celebrationLabel = song?.celebrationType
    ? celebrationTypeLabels[song.celebrationType] || song.celebrationType
    : '';
  const showPending = song?.status === 'pending';

  return (
    <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
      <BackgroundBlobs />
      <Header />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
        {/* iOS-style Back Button - Show when logged in */}
        {session && (
          <Link
            href="/"
            className="flex items-center gap-2 self-start -ml-2 px-2 py-2 hover:opacity-70 transition-opacity mb-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8F6C54]/30 bg-white/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F1E14]">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-[#2F1E14]">Create a Song</span>
          </Link>
        )}
        
        <SongsHeroSection songName={song?.name} celebrationLabel={celebrationLabel} isPending={showPending} />

        {!isMounted || !song ? (
          <LoadingState />
        ) : (
          <>
            {showPending ? (
              <PendingStatusBanner message={song?.message} isPolling={isPolling} />
            ) : (
              <div className="grid w-full gap-6 md:grid-cols-2">
                {song.variations.map((variation, index) => {
                  const isPlaying = playingVariationId === variation.id;
                  const isReady =
                    Boolean(variation.audioUrl) && variation.status !== 'pending';

                  return (
                    <SongVariationCard
                      key={variation.id}
                      variation={variation}
                      index={index}
                      songName={song.name}
                      isPlaying={isPlaying}
                      isReady={isReady}
                      copiedId={copiedId}
                            currentlyPlayingId={playingVariationId}
                      onPlayStateChange={handlePlayStateChange}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      songId={song.id}
                    />
                  );
                })}
              </div>
            )}

            {!session && <SignUpSection />}
          </>
        )}
      </div>
    </main>
  );
}

export default function SongsPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
        <BackgroundBlobs />
        <Header />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
          <LoadingState />
        </div>
      </main>
    }>
      <SongsPageContent />
    </Suspense>
  );
}

