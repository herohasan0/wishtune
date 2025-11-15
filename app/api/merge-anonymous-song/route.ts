import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserCredits } from '@/lib/credits';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const CREDITS_COLLECTION = 'userCredits';

/**
 * POST /api/merge-anonymous-song - Mark that user had 1 anonymous song before login
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const credits = await getUserCredits(session.user.id, session.user.email);
    
    // Only merge if user hasn't created any songs yet (to avoid double counting)
    if (credits.totalSongsCreated === 0) {
      const creditRef = db.collection(CREDITS_COLLECTION).doc(session.user.id);
      await creditRef.update({
        freeSongsUsed: FieldValue.increment(1),
        totalSongsCreated: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error merging anonymous song:', error);
    return NextResponse.json(
      { 
        error: 'Failed to merge anonymous song',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

