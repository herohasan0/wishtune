import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canCreateSong } from '@/lib/credits';
import axios from 'axios';

interface SongRequest {
  name: string;
  celebrationType: string;
  musicStyle: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body: SongRequest = await request.json();
    const { name, celebrationType, musicStyle } = body;

    if (!name || !celebrationType || !musicStyle) {
      return NextResponse.json(
        { error: 'Missing required fields: name, celebrationType, or musicStyle' },
        { status: 400 }
      );
    }

    // Allow first song without authentication
    if (!session?.user?.id) {
      // Check if anonymous song was already created (via header or cookie)
      // For now, we'll allow it and let the frontend track it
    } else {
      // Check if user has credits (logged in users)
      const creditCheck = await canCreateSong(session.user.id, session.user.email);
      if (!creditCheck.canCreate) {
        return NextResponse.json(
          { error: creditCheck.reason || 'Insufficient credits' },
          { status: 403 }
        );
      }
    }

    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      console.error('SUNO_API_KEY is not defined');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Construct prompt
    const prompt = `A joyful ${celebrationType} celebration song for ${name}. The song should be uplifting, celebratory, and include ${name}'s name in the lyrics. Make it heartfelt and memorable.`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callBackUrl = `${baseUrl}/api/suno-callback${session?.user?.id ? `?userId=${session.user.id}` : ''}`;
    const sunoApiBaseUrl = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org/api/v1';

    // Call Suno API
    const sunoResponse = await axios.post(
      `${sunoApiBaseUrl}/generate`,
      {
        prompt: prompt,
        customMode: true,
        style: musicStyle,
        title: name,
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

    const taskId = sunoResponse.data?.data?.taskId;

    if (!taskId) {
      console.error('Failed to get taskId from Suno API', sunoResponse.data);
      return NextResponse.json(
        { error: 'Failed to initiate song generation' },
        { status: 500 }
      );
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
      await saveSong(session.user.id, pendingSong, session.user.email);
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
