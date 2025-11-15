import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const CREDITS_COLLECTION = 'userCredits';

/**
 * POST /api/save-song-count - Save song count to database
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

    const body = await request.json();
    const { count } = body;

    if (typeof count !== 'number' || count < 0) {
      return NextResponse.json(
        { error: 'Invalid count value' },
        { status: 400 }
      );
    }

    const creditRef = db.collection(CREDITS_COLLECTION).doc(session.user.id);
    const creditSnap = await creditRef.get();

    if (creditSnap.exists) {
      const credits = creditSnap.data();
      // Only update if the count in DB is less than the provided count
      // This ensures we don't overwrite a higher count
      if ((credits?.totalSongsCreated || 0) < count) {
        await creditRef.update({
          freeSongsUsed: count,
          totalSongsCreated: count,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Initialize user with the count
      await creditRef.set({
        userId: session.user.id,
        email: session.user.email || null,
        freeSongsUsed: count,
        paidCredits: 0,
        totalSongsCreated: count,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error saving song count:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save song count',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

