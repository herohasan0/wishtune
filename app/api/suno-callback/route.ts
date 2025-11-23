import { NextRequest, NextResponse } from 'next/server';
import { updateSongStatusByTaskId, SongVariation } from '@/lib/songs';

/**
 * Callback endpoint for Suno AI
 * This endpoint receives notifications when song generation is complete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Suno callback received:', JSON.stringify(body));

    const { data, code } = body;

    if (code !== 200 || !data) {
      console.error('Invalid callback data:', body);
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const { task_id, callbackType, data: songData } = data;

    if (!task_id) {
      return NextResponse.json({ success: false, error: 'Missing task_id' }, { status: 400 });
    }

    // Map Suno status to our status
    // callbackType: 'text' | 'first' | 'complete' | 'error'
    let status = 'pending';
    if (callbackType === 'complete') status = 'complete';
    else if (callbackType === 'error') status = 'failed';
    else if (callbackType === 'first') status = 'processing'; // or keep pending/processing

    // Map variations
    let variations: SongVariation[] | undefined;
    if (songData && Array.isArray(songData)) {
      variations = songData.map((item: any) => ({
        id: item.id,
        title: item.title || 'Generated Song',
        duration: formatDuration(item.duration),
        audioUrl: item.audio_url,
        videoUrl: item.video_url,
        imageUrl: item.image_url,
        status: 'complete', // Individual variation status
        prompt: item.prompt,
        tags: item.tags,
      }));
    }

    // Update song in database
    const result = await updateSongStatusByTaskId(task_id, status, variations);

    if (!result.success) {
      console.error('Failed to update song:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Callback processed successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing callback:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process callback'
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

// Also handle GET requests for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Suno AI callback endpoint is active',
    method: 'POST',
    description: 'This endpoint receives callbacks from Suno AI when songs are ready'
  });
}

