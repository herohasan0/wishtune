import { db } from './firebase';
import { 
  FieldValue 
} from 'firebase-admin/firestore';

const CREDITS_COLLECTION = 'userCredits';

export interface UserCredits {
  userId: string;
  email?: string | null;
  paidCredits: number; // Every user gets 1 credit on sign-in, all songs cost 1 credit
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

  // Initialize new user with 1 credit
  // Every signed-in user gets 1 credit by default
  await creditRef.set({
    userId,
    email: email || null,
    paidCredits: 1, // Default: 1 credit for all new users
    totalSongsCreated: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log('✅ New user initialized with 1 credit:', userId);

  // Fetch the created document to get the actual timestamps
  const createdSnap = await creditRef.get();
  return createdSnap.data() as UserCredits;
}

/**
 * Check if user can create a song (requires 1 paid credit)
 * Note: Anonymous users get 1 free song before sign-in (handled separately)
 */
export async function canCreateSong(userId: string, email?: string | null): Promise<{ canCreate: boolean; reason?: string }> {
  const credits = await getUserCredits(userId, email);

  // Check if user has paid credits
  if (credits.paidCredits > 0) {
    return { canCreate: true };
  }

  return {
    canCreate: false,
    reason: 'Insufficient credits. Please purchase credits to create more songs.'
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
        // Initialize user with 1 credit and deduct for this song
        transaction.set(creditRef, {
          userId,
          email: email || null,
          paidCredits: 0, // Started with 1, using it for this song
          totalSongsCreated: 1,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log('✅ New user initialized and used 1 credit:', userId);
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

      // Check if user has enough credits
      if (credits.paidCredits < 1) {
        throw new Error('Insufficient credits');
      }

      // Deduct 1 credit
      transaction.update(creditRef, {
        paidCredits: FieldValue.increment(-1),
        totalSongsCreated: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  } catch (error) {
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
        paidCredits: amount,
        totalSongsCreated: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('✅ New user initialized with purchased credits:', userId);
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add credits' 
    };
  }
}

