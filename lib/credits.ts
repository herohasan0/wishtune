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
 * Always deducts exactly 1 credit per song, regardless of variations
 * @param userId - User ID
 * @param email - User email (optional)
 */
export async function deductCreditForSong(userId: string, email?: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const creditSnap = await transaction.get(creditRef);
      
      if (!creditSnap.exists) {
        // Initialize user credits - first song is free
        transaction.set(creditRef, {
          userId,
          email: email || null,
          freeSongsUsed: 1,
          paidCredits: 0,
          totalSongsCreated: 1,
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

      // Calculate if this song should use free credit or paid credit
      const freeSongsRemaining = Math.max(0, 2 - credits.totalSongsCreated);
      const useFreeCredit = freeSongsRemaining > 0;
      const usePaidCredit = !useFreeCredit;

      // Check if user has enough credits
      if (usePaidCredit && credits.paidCredits < 1) {
        throw new Error('Insufficient credits');
      }

      // Update credits - always deduct exactly 1 credit
      const updates: any = {
        totalSongsCreated: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (useFreeCredit) {
        updates.freeSongsUsed = FieldValue.increment(1);
      }

      if (usePaidCredit) {
        updates.paidCredits = FieldValue.increment(-1);
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

