import { db } from './firebase';
import { 
  FieldValue 
} from 'firebase-admin/firestore';

const FREE_SONGS_LIMIT = 2;
const CREDITS_COLLECTION = 'userCredits';

export interface UserCredits {
  userId: string;
  freeSongsUsed: number;
  paidCredits: number;
  totalSongsCreated: number;
  createdAt: FirebaseFirestore.Timestamp | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

/**
 * Get user's credit information
 */
export async function getUserCredits(userId: string): Promise<UserCredits> {
  const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
  const creditSnap = await creditRef.get();

  if (creditSnap.exists) {
    return creditSnap.data() as UserCredits;
  }

  // Initialize new user with default credits
  await creditRef.set({
    userId,
    freeSongsUsed: 0,
    paidCredits: 0,
    totalSongsCreated: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Fetch the created document to get the actual timestamps
  const createdSnap = await creditRef.get();
  return createdSnap.data() as UserCredits;
}

/**
 * Check if user can create a song (has free songs or paid credits)
 */
export async function canCreateSong(userId: string): Promise<{ canCreate: boolean; reason?: string }> {
  const credits = await getUserCredits(userId);
  
  const hasFreeSongs = credits.freeSongsUsed < FREE_SONGS_LIMIT;
  const hasPaidCredits = credits.paidCredits > 0;

  if (hasFreeSongs || hasPaidCredits) {
    return { canCreate: true };
  }

  return { 
    canCreate: false, 
    reason: 'You have used all free songs. Please purchase credits to create more songs.' 
  };
}

/**
 * Deduct credit when creating a song (uses transaction for atomicity)
 */
export async function deductCreditForSong(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const creditSnap = await transaction.get(creditRef);
      
      if (!creditSnap.exists) {
        // Initialize user credits
        transaction.set(creditRef, {
          userId,
          freeSongsUsed: 1,
          paidCredits: 0,
          totalSongsCreated: 1,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const credits = creditSnap.data() as UserCredits;
      const hasFreeSongs = credits.freeSongsUsed < FREE_SONGS_LIMIT;
      
      if (hasFreeSongs) {
        // Use free song
        transaction.update(creditRef, {
          freeSongsUsed: FieldValue.increment(1),
          totalSongsCreated: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else if (credits.paidCredits > 0) {
        // Use paid credit
        transaction.update(creditRef, {
          paidCredits: FieldValue.increment(-1),
          totalSongsCreated: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        throw new Error('No credits available');
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deducting credit:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deduct credit' 
    };
  }
}

/**
 * Add paid credits to user account (for when they purchase)
 */
export async function addPaidCredits(userId: string, amount: number): Promise<{ success: boolean; error?: string }> {
  try {
    const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
    const creditSnap = await creditRef.get();

    if (creditSnap.exists) {
      await creditRef.update({
        paidCredits: FieldValue.increment(amount),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Initialize user if they don't exist
      await creditRef.set({
        userId,
        freeSongsUsed: 0,
        paidCredits: amount,
        totalSongsCreated: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding paid credits:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add credits' 
    };
  }
}

