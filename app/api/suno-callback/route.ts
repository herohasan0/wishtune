import { NextRequest, NextResponse } from 'next/server';
import { updateSongStatusByTaskId, SongVariation } from '@/lib/songs';
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/ratelimit';
import { verifyWebhookRequest } from '@/lib/webhook-security';

/**
 * Callback endpoint for Suno AI
 * This endpoint receives notifications when song generation is complete
 *
 * Security Features:
 * 1. Rate limiting to prevent abuse
 * 2. Optional webhook signature verification (if SUNO_WEBHOOK_SECRET is set)
 * 3. Request validation
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent callback abuse
    const identifier = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.WEBHOOK);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Get raw body for signature verification
    const bodyText = await request.text();
    let body: any;

    try {
      body = JSON.parse(bodyText);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.SUNO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const verification = await verifyWebhookRequest(
        request,
        bodyText,
        {
          secret: webhookSecret,
          signatureHeader: 'x-suno-signature', // Adjust based on Suno's actual header
          algorithm: 'sha256',
        }
      );

      if (!verification.valid) {
        console.warn('Webhook signature verification failed:', verification.error);
        return NextResponse.json(
          { success: false, error: 'Unauthorized webhook request' },
          { status: 401 }
        );
      }
    } else {
      // Log warning if webhook secret is not configured
      console.warn(
        'SUNO_WEBHOOK_SECRET not configured. Webhook signatures are not being verified. ' +
        'This is a security risk in production!'
      );
    }



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
        audioUrl: item.audio_url || '',
        videoUrl: item.video_url || '',
        imageUrl: item.image_url || '',
        status: item.audio_url ? 'complete' : 'processing', // Mark as processing if no audio yet
        prompt: item.prompt || '',
        tags: item.tags || '',
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

