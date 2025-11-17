import { useEffect, useState } from 'react';
import axios from 'axios';

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

interface UseSongPollingProps {
  song: Song | null;
  onSongUpdate: (updatedSong: Song) => void;
}

export function useSongPolling({ song, onSongUpdate }: UseSongPollingProps) {
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!song || song.status !== 'pending' || !song.taskId) {
      return;
    }

    setIsPolling(true);
    console.log('🔄 Starting to poll for song status. TaskId:', song.taskId);

    let pollCount = 0;
    const maxPolls = 15; // 5 minutes max (15 * 20 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`🔍 Polling attempt ${pollCount}/${maxPolls}...`);

      try {
        const response = await axios.get(`/api/check-song-status?taskId=${song.taskId}`);
        const data = response.data;

        console.log('📥 Poll response:', data);

        if (data.status === 'complete' && data.variations) {
          console.log('✅ Songs are ready!');
          clearInterval(pollInterval);
          setIsPolling(false);

          // Update song with complete variations
          onSongUpdate({
            ...song,
            status: 'complete',
            variations: data.variations,
          });
        } else if (data.status === 'failed') {
          console.error('❌ Song generation failed:', data.error);
          clearInterval(pollInterval);
          setIsPolling(false);
          alert(`Song generation failed: ${data.error}`);
        } else if (pollCount >= maxPolls) {
          console.warn('⏰ Polling timeout reached');
          clearInterval(pollInterval);
          setIsPolling(false);
          alert('Song generation is taking longer than expected. Please try again later.');
        }
        // else: still pending, continue polling
      } catch (error) {
        console.error('❌ Error polling song status:', error);
        // Don't stop polling on network errors, just log them
      }
    }, 20000); // Poll every 20 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.taskId, song?.status]);

  return isPolling;
}

