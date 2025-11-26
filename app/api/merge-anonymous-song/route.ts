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

    const { visitorId } = await request.json();

    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 });
    }

    const credits = await getUserCredits(session.user.id, session.user.email);
    
    // Find anonymous songs for this visitor
    const songsRef = db.collection('songs');
    const anonymousSongsQuery = await songsRef
      .where('visitorId', '==', visitorId)
      .where('userId', '==', `anonymous_${visitorId}`)
      .get();

    if (anonymousSongsQuery.empty) {
       return NextResponse.json({ success: true, message: 'No anonymous songs found' }, { status: 200 });
    }

    const batch = db.batch();
    let songsMerged = 0;

    anonymousSongsQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        userId: session.user?.id,
        updatedAt: FieldValue.serverTimestamp(),
        // Keep visitorId for record, or remove it if you prefer
      });
      songsMerged++;
    });

    // Anonymous songs don't count towards totalSongsCreated
    // They were created before sign-in, so user still has their 1 credit available
    // No need to update credits here - user keeps their 1 credit

    await batch.commit();
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { 
        error: 'Failed to merge anonymous song',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

