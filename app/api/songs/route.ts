import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserSongs } from '@/lib/songs';
import type { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/songs - Get all songs for the authenticated user or anonymous user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');

    // Determine userId based on authentication status
    let userId: string;

    if (session?.user?.id) {
      // Authenticated user
      userId = session.user.id;
    } else if (visitorId) {
      // Anonymous user with visitorId
      userId = `anonymous_${visitorId}`;
    } else {
      // No authentication and no visitorId
      return NextResponse.json(
        { error: 'Authentication or visitor ID required' },
        { status: 401 }
      );
    }

    const songs = await getUserSongs(userId);
    
    // Convert Firestore timestamps to ISO strings for JSON serialization
    const serializedSongs = songs.map((song) => {
      let createdAt: string | Timestamp | undefined = song.createdAt;
      let updatedAt: string | Timestamp | undefined = song.updatedAt;
      
      // Handle Firestore Timestamp objects
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate().toISOString();
      } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
        // Handle timestamp-like objects
        createdAt = new Date(createdAt.seconds * 1000).toISOString();
      } else if (typeof createdAt === 'string') {
        // Already a string, keep as is
        createdAt = createdAt;
      }
      
      if (updatedAt && typeof updatedAt.toDate === 'function') {
        updatedAt = updatedAt.toDate().toISOString();
      } else if (updatedAt && typeof updatedAt === 'object' && 'seconds' in updatedAt) {
        updatedAt = new Date(updatedAt.seconds * 1000).toISOString();
      } else if (typeof updatedAt === 'string') {
        updatedAt = updatedAt;
      }
      
      return {
        ...song,
        createdAt,
        updatedAt,
      };
    });

    return NextResponse.json({ songs: serializedSongs }, { status: 200 });
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? {
      message: errorMessage,
      name: error.name,
      stack: error.stack,
    } : { message: errorMessage };
    
    return NextResponse.json(
      {
        error: 'Failed to fetch songs',
        details: errorMessage,
        ...errorDetails,
      },
      { status: 500 }
    );
  }
}

