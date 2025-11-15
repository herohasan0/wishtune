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
 * Deduct credit when creating a song (uses transaction for atomicity)
 */
export async function deductCreditForSong(userId: string, email?: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const creditRef = db.collection(CREDITS_COLLECTION).doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const creditSnap = await transaction.get(creditRef);
      
      if (!creditSnap.exists) {
        // Initialize user credits
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

      // Check if user has created less than 2 songs (free songs remaining)
      const hasFreeSongsRemaining = credits.totalSongsCreated < 2;
      
      if (hasFreeSongsRemaining) {
        // Use free song (increment totalSongsCreated)
        transaction.update(creditRef, {
          freeSongsUsed: FieldValue.increment(1),
          totalSongsCreated: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else if (credits.paidCredits > 0) {
        // Use paid credit (user has already created 2 songs)
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

