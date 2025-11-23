import { NextRequest, NextResponse } from 'next/server';
import { updateSongStatusByTaskId, SongVariation } from '@/lib/songs';
import { db } from '@/lib/firebase';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId parameter' },
        { status: 400 }
      );
    }

    // 1. Check database first
    const songsRef = db.collection('songs');
    const snapshot = await songsRef.where('taskId', '==', taskId).limit(1).get();

    if (!snapshot.empty) {
      const songDoc = snapshot.docs[0];
      const songData = songDoc.data();

      // If song is already complete in DB (via callback), return it
      if (songData.status === 'complete') {
        return NextResponse.json({
          status: 'complete',
          taskId: taskId,
          variations: songData.variations
        }, { status: 200 });
      }
      
      // If failed, return failed
      if (songData.status === 'failed') {
        return NextResponse.json({
          status: 'failed',
          taskId: taskId,
          error: 'Song generation failed'
        }, { status: 200 });
      }
    }

    // 2. If not complete in DB, just return pending (Callback will update it)
    return NextResponse.json({ status: 'pending', taskId }, { status: 200 });
  } catch (error) {
    console.error('Error checking song status:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

