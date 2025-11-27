import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canCreateSong } from '@/lib/credits';
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/ratelimit';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';

interface SongRequest {
  name: string;
  celebrationType: string;
  musicStyle: string;
  duration: number;
  visitorId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Apply rate limiting (5 songs per minute per user/IP)
    const identifier = getClientIdentifier(request, session?.user?.id);
    const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.SONG_CREATION);

    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.reset).toISOString();
      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down.',
          resetAt: resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body: SongRequest = await request.json();
    const { name, celebrationType, musicStyle, duration = 60, visitorId } = body;

    if (!name || !celebrationType || !musicStyle) {
      return NextResponse.json(
        { error: 'Missing required fields: name, celebrationType, or musicStyle' },
        { status: 400 }
      );
    }

    // Allow first song without authentication
    if (!session?.user?.id) {
      if (!visitorId) {
        return NextResponse.json(
          { error: 'Visitor ID is required for anonymous usage' },
          { status: 400 }
        );
      }

      const anonymousUsageRef = db.collection('anonymous_usages').doc(visitorId);
      const anonymousUsageSnap = await anonymousUsageRef.get();

      if (anonymousUsageSnap.exists) {
        return NextResponse.json(
          { error: 'You have already used your free song. Please sign in to create more.' },
          { status: 403 }
        );
      }

      // Record usage
      await anonymousUsageRef.set({
        visitorId,
        createdAt: FieldValue.serverTimestamp(),
        songName: name,
        celebrationType,
        musicStyle,
      });
    } else {
      // Check if user has credits (logged in users)
      const creditCheck = await canCreateSong(session.user.id, session.user.email);
      if (!creditCheck.canCreate) {
        return NextResponse.json(
          { error: creditCheck.reason || 'Insufficient credits' },
          { status: 403 }
        );
      }

      // Deduct credit
      const { deductCreditForSong } = await import('@/lib/credits');
      const deductionResult = await deductCreditForSong(session.user.id, session.user.email);
      
      if (!deductionResult.success) {
        console.error('Failed to deduct credit:', deductionResult.error);
        return NextResponse.json(
          { error: 'Failed to process credit deduction. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Check if mock mode is enabled for testing
    const useMockMode = process.env.USE_MOCK_SUNO === 'true';
    let taskId: string;

    if (useMockMode) {
      // Mock mode: generate a fake taskId without calling Suno API
      taskId = `mock-task-${Date.now()}`;

      // Simulate async completion in mock mode
      (async () => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const { updateSongStatusByTaskId } = await import('@/lib/songs');
        await updateSongStatusByTaskId(taskId, 'complete', [
          {
            id: `mock-var-1-${Date.now()}`,
            title: 'Mock Version 1',
            duration: '1:30',
            status: 'complete',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Sample MP3
            imageUrl: 'https://picsum.photos/200',
          },
          {
            id: `mock-var-2-${Date.now()}`,
            title: 'Mock Version 2',
            duration: '1:45',
            status: 'complete',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Sample MP3
            imageUrl: 'https://picsum.photos/200',
          }
        ]);
        console.log('✅ Mock song generation completed for task:', taskId);
      })();

    } else {
      // Production mode: call Suno API
      const apiKey = process.env.SUNO_API_KEY;
      if (!apiKey) {
        console.error('SUNO_API_KEY is not defined');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      // Construct prompt (max 500 chars for non-custom mode)
      const prompt = `A ${musicStyle} ${celebrationType} song for ${name}. Start with "${name}" in the first line. Uplifting, ${duration} seconds long. Include ${name}'s name throughout. Full track with verse, chorus, bridge. ${musicStyle} style.`;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const callBackUrl = `${baseUrl}/api/suno-callback${session?.user?.id ? `?userId=${session.user.id}` : ''}`;
      const sunoApiBaseUrl = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org/api/v1';

      // Call Suno API
      const sunoResponse = await axios.post(
        `${sunoApiBaseUrl}/generate`,
        {
          prompt: prompt,
          customMode: false,
          model: 'V5',
          instrumental: false,
          callBackUrl: callBackUrl,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      taskId = sunoResponse.data?.data?.taskId;

      if (!taskId) {
        console.error('Failed to get taskId from Suno API', sunoResponse.data);
        return NextResponse.json(
          { error: 'Failed to initiate song generation' },
          { status: 500 }
        );
      }
    }

    // Return pending song with taskId for polling
    const pendingSong = {
      id: Date.now().toString(),
      name: name.trim(),
      celebrationType: celebrationType,
      style: musicStyle,
      createdAt: new Date().toISOString(),
      taskId: taskId,
      status: 'pending',
      message: 'Songs are being generated. This may take 30-60 seconds.',
      variations: [
        {
          id: 'pending-1',
          title: 'Version 1',
          duration: '0:00',
          status: 'pending'
        },
        {
          id: 'pending-2',
          title: 'Version 2',
          duration: '0:00',
          status: 'pending'
        }
      ]
    };

    // Save pending song to database immediately so callback can find it
    if (session?.user?.id) {

      const { saveSong } = await import('@/lib/songs');
      const saveResult = await saveSong(session.user.id, pendingSong, session.user.email);


      if (!saveResult.success) {
        console.error('❌ Failed to save song:', saveResult.error);
        return NextResponse.json(
          { error: `Failed to save song: ${saveResult.error}` },
          { status: 500 }
        );
      }
    } else if (visitorId) {
      // Save anonymous song with special userId format


      const { saveSong } = await import('@/lib/songs');
      const saveResult = await saveSong(`anonymous_${visitorId}`, pendingSong, null, visitorId);


      if (!saveResult.success) {
        console.error('❌ Failed to save anonymous song:', saveResult.error);
        return NextResponse.json(
          { error: `Failed to save song: ${saveResult.error}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(pendingSong, { status: 200 });
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while creating the song',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}
