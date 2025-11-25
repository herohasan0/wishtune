import { useEffect, useState } from 'react';
import { clientDb, signInWithSessionToken } from '@/lib/firebaseClient';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';

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
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Only listen if song is pending and has a taskId
    if (!song || song.status !== 'pending' || !song.taskId) {
      return;
    }

    // Guard against missing Firebase client config
    if (!clientDb) {
      console.error('Firebase client not initialized. Please add NEXT_PUBLIC_FIREBASE_* env variables.');
      return;
    }

    let unsubscribe: (() => void) | undefined;

    // Sign in to Firebase Auth first, then set up listener
    const setupRealtimeListener = async () => {
      try {
        // Authenticate with Firebase (tries to use existing auth or gets new token)
        const signedIn = await signInWithSessionToken();

        if (!signedIn) {
          console.error('Failed to sign in to Firebase Auth for song polling');
          return;
        }

        setIsListening(true);

        // Create a query to find the song by taskId
        const songsRef = collection(clientDb, 'songs');
        const q = query(songsRef, where('taskId', '==', song.taskId), limit(1));

        // Set up real-time listener
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const docData = snapshot.docs[0].data();

              // Check if status has changed to complete or failed
              if (docData.status === 'complete' && docData.variations) {
                setIsListening(false);

                // Update song with complete variations
                onSongUpdate({
                  ...song,
                  status: 'complete',
                  variations: docData.variations,
                });
              } else if (docData.status === 'failed') {
                setIsListening(false);
                alert('Song generation failed. Please try again.');
              }
              // If still pending/processing, listener stays active
            }
          },
          (error) => {
            console.error('Error listening to song updates:', error);
            setIsListening(false);
            // Optionally show user-friendly error or fallback to polling
          }
        );
      } catch (error) {
        console.error('Error setting up song polling listener:', error);
        setIsListening(false);
      }
    };

    setupRealtimeListener();

    // Cleanup: unsubscribe from listener when component unmounts or song changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      setIsListening(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.taskId, song?.status]);

  return isListening;
}

