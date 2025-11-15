'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import SongsHeroSection from '../components/SongsHeroSection';
import PendingStatusBanner from '../components/PendingStatusBanner';
import LoadingState from '../components/LoadingState';
import SongVariationCard from '../components/SongVariationCard';
import SignUpSection from '../components/SignUpSection';
import { useSongPolling } from '../hooks/useSongPolling';
import { celebrationTypeLabels } from '../utils/constants';

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

export default function SongsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [song, setSong] = useState<Song | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingVariationId, setPlayingVariationId] = useState<string | null>(null);

  useEffect(() => {
    // Load song from URL params - this is the correct place to set initial state from URL
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  const handleShare = async (songId: string, variationId: string) => {
    const shareUrl = `${window.location.origin}/songs/${songId}/${variationId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my WishTune song!',
          url: shareUrl,
        });
      } catch {
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

  const handleDownload = (songName: string, variationTitle: string, audioUrl?: string) => {
    if (!audioUrl) {
      alert('Audio not available for download yet.');
      return;
    }

    const fileName = `${songName}-${variationTitle}.mp3`;
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = fileName;
    link.target = '_blank';
    link.click();
  };

  const handlePlayStateChange = (variationId: string, isPlaying: boolean) => {
    setPlayingVariationId(isPlaying ? variationId : null);
  };

  const handleSongUpdate = (updatedSong: Song) => {
    setSong(updatedSong);
  };

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
    <main className="relative min-h-screen overflow-hidden bg-[#FFF5EB] px-4 py-6 text-[#3F2A1F] sm:py-10">
      <BackgroundBlobs />
      <Header />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
        <SongsHeroSection songName={song?.name} celebrationLabel={celebrationLabel} />

        {showPending && (
          <PendingStatusBanner message={song?.message} isPolling={isPolling} />
        )}

        {!song ? (
          <LoadingState />
        ) : (
          <>
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

            {!session && <SignUpSection />}
          </>
        )}
      </div>
    </main>
  );
}

