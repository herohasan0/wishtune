import { db } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';

const SONGS_COLLECTION = 'songs';

export interface SongVariation {
  id: string;
  title: string;
  duration: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  status?: string;
  prompt?: string;
  tags?: string;
}

export interface SongDocument {
  id: string;
  userId: string;
  email?: string | null;
  name: string;
  celebrationType?: string;
  style: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  variations: SongVariation[];
  taskId?: string;
  status: string;
  message?: string;
}

/**
 * Save a song to the database
 */
export async function saveSong(
  userId: string,
  song: {
    id: string;
    name: string;
    celebrationType?: string;
    style: string;
    createdAt: string;
    variations: SongVariation[];
    taskId?: string;
    status: string;
    message?: string;
  },
  email?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const songRef = db.collection(SONGS_COLLECTION).doc(song.id);
    
    // Check if song already exists
    const existingSong = await songRef.get();
    
    const songData: Partial<SongDocument> = {
      id: song.id,
      userId,
      email: email || null,
      name: song.name,
      celebrationType: song.celebrationType,
      style: song.style,
      variations: song.variations,
      taskId: song.taskId,
      status: song.status,
      message: song.message,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (existingSong.exists) {
      // Update existing song
      await songRef.update(songData);
    } else {
      // Create new song
      songData.createdAt = FieldValue.serverTimestamp();
      await songRef.set(songData);
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving song:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save song',
    };
  }
}

/**
 * Get all songs for a user
 */
export async function getUserSongs(
  userId: string
): Promise<SongDocument[]> {
  try {
    // Try with orderBy first (requires composite index)
    try {
      const songsSnapshot = await db
        .collection(SONGS_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return songsSnapshot.docs.map((doc) => doc.data() as SongDocument);
    } catch (orderByError: any) {
      // If orderBy fails (likely due to missing index), fetch without orderBy and sort in memory
      if (orderByError?.code === 9 || orderByError?.message?.includes('index')) {
        console.warn('⚠️ Composite index not found, fetching without orderBy and sorting in memory');
        const songsSnapshot = await db
          .collection(SONGS_COLLECTION)
          .where('userId', '==', userId)
          .get();

        const songs = songsSnapshot.docs.map((doc) => doc.data() as SongDocument);
        
        // Sort by createdAt in memory (descending)
        return songs.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
      }
      // Re-throw if it's a different error
      throw orderByError;
    }
  } catch (error) {
    console.error('Error fetching user songs:', error);
    throw error;
  }
}

/**
 * Get a specific song by ID
 */
export async function getSongById(songId: string): Promise<SongDocument | null> {
  try {
    const songDoc = await db.collection(SONGS_COLLECTION).doc(songId).get();
    
    if (!songDoc.exists) {
      return null;
    }
    
    return songDoc.data() as SongDocument;
  } catch (error) {
    console.error('Error fetching song:', error);
    throw error;
  }
}

