import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserSongs } from '@/lib/songs';
import type { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/songs - Get all songs for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const songs = await getUserSongs(session.user.id);
    
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
    console.error('❌ Error fetching songs:', error);
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

