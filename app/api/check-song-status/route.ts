import { NextRequest, NextResponse } from 'next/server';

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

    // Mock response - return hardcoded data instead of making API request
    // NOTE: Original Suno AI mock URLs (commented out for later use):
    // audioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.mp3',
    // streamAudioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2',
    // imageUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.jpeg',
    //
    // audioUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1.mp3',
    // streamAudioUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1',
    // imageUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1.jpeg',
    
    // Using Suno AI mock URLs (these will be proxied through /api/proxy-audio to handle CORS)
    const mockResponse = {
      status: 'complete',
      taskId: 'dde26b1983596bf6c3beef3e1064e10a',
      variations: [
        {
          id: '34fcc4ad-eb8a-4b5a-8a65-d77df95b2cc6',
          title: 'Version 1',
          duration: '0:41',
          audioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.mp3',
          streamAudioUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2',
          imageUrl: 'https://musicfile.api.box/MzRmY2M0YWQtZWI4YS00YjVhLThhNjUtZDc3ZGY5NWIyY2M2.jpeg',
          status: 'complete',
          prompt: 'A joyful birthday celebration song for hasan. The song should be uplifting, celebratory, and include hasan\'s name in the lyrics. Make it heartfelt and memorable.',
          tags: 'Pop'
        },
        {
          id: 'de1078c8-5422-4b32-927b-4a98d62b7525',
          title: 'Version 2',
          duration: '0:21',
          audioUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1.mp3',
          streamAudioUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1',
          imageUrl: 'https://musicfile.api.box/ZGUxMDc4YzgtNTQyMi00YjMyLTkyN2ItNGE5OGQ2MmI3NTI1.jpeg',
          status: 'complete',
          prompt: 'A joyful birthday celebration song for hasan. The song should be uplifting, celebratory, and include hasan\'s name in the lyrics. Make it heartfelt and memorable.',
          tags: 'Pop'
        }
      ]
    };
    
    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

