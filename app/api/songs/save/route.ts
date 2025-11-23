import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { saveSong } from '@/lib/songs';

interface SongVariation {
  id: string;
  title: string;
  duration: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  status?: string;
  prompt?: string;
  tags?: string;
}

interface SongRequest {
  id: string;
  name: string;
  celebrationType?: string;
  style: string;
  createdAt: string;
  variations: SongVariation[];
  taskId?: string;
  status: string;
  message?: string;
}

/**
 * POST /api/songs/save - Save a song to the database
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

    const body: SongRequest = await request.json();
    
    if (!body.id || !body.name || !body.style) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, or style' },
        { status: 400 }
      );
    }

    const result = await saveSong(
      session.user.id,
      body,
      session.user.email
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save song' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      {
        error: 'Failed to save song',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

