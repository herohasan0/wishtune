import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canCreateSong, deductCreditForSong } from '@/lib/credits';

interface SongRequest {
  name: string;
  celebrationType: string;
  musicStyle: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Song creation request received');
    
    const session = await auth();
    const body: SongRequest = await request.json();
    const { name, celebrationType, musicStyle } = body;

    console.log('Request params:', { name, celebrationType, musicStyle });

    if (!name || !celebrationType || !musicStyle) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name, celebrationType, or musicStyle' },
        { status: 400 }
      );
    }

    // Allow first song without authentication
    if (!session?.user?.id) {
      // Check if anonymous song was already created (via header or cookie)
      // For now, we'll allow it and let the frontend track it
      console.log('📝 Anonymous song creation - allowing first song');
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

    // Mock response - return pending song with taskId for polling
    console.log('📦 Returning mock response (API calls disabled)');
    
    // NOTE: For instant testing without polling, uncomment this complete response:
    /*
    const mockSong = {
      id: Date.now().toString(),
      name: name.trim(),
      celebrationType: celebrationType,
      style: musicStyle,
      createdAt: new Date().toISOString(),
      taskId: 'dde26b1983596bf6c3beef3e1064e10a',
      status: 'complete',
      message: 'Songs are ready!',
      variations: [
        {
          id: '34fcc4ad-eb8a-4b5a-8a65-d77df95b2cc6',
          title: 'Version 1',
          duration: '0:41',
          audioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.mp3',
          streamAudioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2',
          imageUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.jpeg',
          status: 'complete',
          prompt: `A joyful ${celebrationType} celebration song for ${name}. The song should be uplifting, celebratory, and include ${name}'s name in the lyrics. Make it heartfelt and memorable.`,
          tags: musicStyle
        },
        {
          id: 'de1078c8-5422-4b32-927b-4a98d62b7525',
          title: 'Version 2',
          duration: '0:21',
          audioUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1.mp3',
          streamAudioUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1',
          imageUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1.jpeg',
          status: 'complete',
          prompt: `A joyful ${celebrationType} celebration song for ${name}. The song should be uplifting, celebratory, and include ${name}'s name in the lyrics. Make it heartfelt and memorable.`,
          tags: musicStyle
        }
      ]
    };
    */
    
    // Original Suno AI mock URLs for reference (when songs are complete):
    // audioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.mp3',
    // streamAudioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2',
    // imageUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.jpeg',
    
    // Default: Return pending status (requires polling check-song-status)
    const mockSong = {
      id: Date.now().toString(),
      name: name.trim(),
      celebrationType: celebrationType,
      style: musicStyle,
      createdAt: new Date().toISOString(),
      taskId: 'dde26b1983596bf6c3beef3e1064e10a',
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

    // Deduct credit after successful song creation (only for logged-in users)
    if (session?.user?.id) {
    const deductResult = await deductCreditForSong(session.user.id, session.user.email);
    if (!deductResult.success) {
      console.error('❌ Failed to deduct credit:', deductResult.error);
      return NextResponse.json(
        { error: 'Failed to process credit. Please try again.' },
        { status: 500 }
      );
      }
    }

    console.log('✅ Returning mock song with', mockSong.variations.length, 'variations');
    return NextResponse.json(mockSong, { status: 200 });
  } catch (error) {
    console.error('❌ Unexpected error creating song:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
