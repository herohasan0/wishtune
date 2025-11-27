import { db } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';
import type { Timestamp } from 'firebase-admin/firestore';

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
  lyrics?: string;
  lyricsTimestamped?: Array<{ timestamp: number; text: string }>;
}

export interface SongDocument {
  id: string;
  userId: string;
  email?: string | null;
  name: string;
  celebrationType?: string;
  style: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  variations: SongVariation[];
  taskId?: string;
  status: string;
  message?: string;
  visitorId?: string;
}

// Type for creating/updating songs that allows FieldValue for timestamps
type SongUpdateData = Omit<Partial<SongDocument>, 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp | ReturnType<typeof FieldValue.serverTimestamp>;
  updatedAt?: Timestamp | ReturnType<typeof FieldValue.serverTimestamp>;
};

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
  email?: string | null,
  visitorId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const songRef = db.collection(SONGS_COLLECTION).doc(song.id);
    
    // Check if song already exists
    const existingSong = await songRef.get();
    
    const songData: SongUpdateData = {
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

    if (visitorId) {
      songData.visitorId = visitorId;
    }

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
    } catch (orderByError: unknown) {
      // If orderBy fails (likely due to missing index), fetch without orderBy and sort in memory
      const error = orderByError as { code?: number; message?: string };
      if (error?.code === 9 || error?.message?.includes('index')) {
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
    throw error;
  }
}


/**
 * Update song status by taskId
 */
export async function updateSongStatusByTaskId(
  taskId: string,
  status: string,
  variations?: SongVariation[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const songsRef = db.collection(SONGS_COLLECTION);
    const snapshot = await songsRef.where('taskId', '==', taskId).limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: 'Song not found' };
    }

    const doc = snapshot.docs[0];
    const updateData: any = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (variations) {
      updateData.variations = variations;
    }

    await doc.ref.update(updateData);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update song',
    };
  }
}

/**
 * Delete a song from the database
 */
export async function deleteSong(
  songId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const songRef = db.collection(SONGS_COLLECTION).doc(songId);
    const songDoc = await songRef.get();

    if (!songDoc.exists) {
      return { success: false, error: 'Song not found' };
    }

    const songData = songDoc.data() as SongDocument;

    // Verify ownership
    if (songData.userId !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await songRef.delete();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete song',
    };
  }
}
