import { db } from './firebase';
import { 
  FieldValue 
} from 'firebase-admin/firestore';

const FREE_SONGS_LIMIT = 2;
const CREDITS_COLLECTION = 'userCredits';

export interface UserCredits {
  userId: string;
  email?: string | null;
  freeSongsUsed: number;
  paidCredits: number;
  totalSongsCreated: number;
  createdAt: FirebaseFirestore.Timestamp | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

/**
 * Get user's credit information
 */
export async function getUserCredits(userId: string, email?: string | null): Promise<UserCredits> {
  const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
  const creditSnap = await creditRef.get();

  if (creditSnap.exists) {
    const data = creditSnap.data() as UserCredits;
    // Update email if provided and not already set
    if (email && !data.email) {
      await creditRef.update({
        email,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { ...data, email };
    }
    return data;
  }

  // Initialize new user with default credits
  await creditRef.set({
    userId,
    email: email || null,
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
 * Check if user can create a song (allows 2 total songs, then requires paid credits)
 */
export async function canCreateSong(userId: string, email?: string | null): Promise<{ canCreate: boolean; reason?: string }> {
  const credits = await getUserCredits(userId, email);
  
  // Allow creation if user has created less than 2 songs total, or has paid credits
  const hasFreeSongsRemaining = credits.totalSongsCreated < 2;
  const hasPaidCredits = credits.paidCredits > 0;

  if (hasFreeSongsRemaining || hasPaidCredits) {
    return { canCreate: true };
  }

  return { 
    canCreate: false, 
    reason: 'You have created 2 free songs. Please purchase credits to create more songs.' 
  };
}

/**
 * Deduct credits when creating a song (uses transaction for atomicity)
 * @param userId - User ID
 * @param email - User email (optional)
 * @param variationCount - Number of variations (songs) to deduct credits for
 */
export async function deductCreditForSong(userId: string, email?: string | null, variationCount: number = 1): Promise<{ success: boolean; error?: string }> {
  try {
    if (variationCount <= 0) {
      return { success: false, error: 'Invalid variation count' };
    }

    const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const creditSnap = await transaction.get(creditRef);
      
      if (!creditSnap.exists) {
        // Initialize user credits
        const freeSongsToUse = Math.min(variationCount, 2); // Max 2 free songs
        const paidCreditsToUse = Math.max(0, variationCount - freeSongsToUse);
        
        // For new users, they start with 0 paid credits, so if they need paid credits, throw error
        if (paidCreditsToUse > 0) {
          throw new Error('Insufficient credits');
        }
        
        transaction.set(creditRef, {
          userId,
          email: email || null,
          freeSongsUsed: freeSongsToUse,
          paidCredits: 0,
          totalSongsCreated: variationCount,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      // Update email if provided and not already set
      const credits = creditSnap.data() as UserCredits;
      if (email && !credits.email) {
        transaction.update(creditRef, {
          email,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Calculate how many free songs are remaining
      const freeSongsRemaining = Math.max(0, 2 - credits.totalSongsCreated);
      const freeSongsToUse = Math.min(variationCount, freeSongsRemaining);
      const paidCreditsToUse = variationCount - freeSongsToUse;

      // Check if user has enough credits
      if (paidCreditsToUse > 0 && credits.paidCredits < paidCreditsToUse) {
        throw new Error('Insufficient credits');
      }

      // Update credits
      const updates: any = {
        totalSongsCreated: FieldValue.increment(variationCount),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (freeSongsToUse > 0) {
        updates.freeSongsUsed = FieldValue.increment(freeSongsToUse);
      }

      if (paidCreditsToUse > 0) {
        updates.paidCredits = FieldValue.increment(-paidCreditsToUse);
      }

      transaction.update(creditRef, updates);
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
export async function addPaidCredits(userId: string, amount: number, email?: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
    const creditSnap = await creditRef.get();

    if (creditSnap.exists) {
      const credits = creditSnap.data() as UserCredits;
      const updateData: any = {
        paidCredits: FieldValue.increment(amount),
        updatedAt: FieldValue.serverTimestamp(),
      };
      // Update email if provided and not already set
      if (email && !credits.email) {
        updateData.email = email;
      }
      await creditRef.update(updateData);
    } else {
      // Initialize user if they don't exist
      await creditRef.set({
        userId,
        email: email || null,
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

