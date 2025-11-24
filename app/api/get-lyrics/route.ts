import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, audioId } = body;

    if (!taskId || !audioId) {
      return NextResponse.json(
        { error: 'Both taskId and audioId are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      console.error('SUNO_API_KEY is not defined');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const sunoApiBaseUrl = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org/api/v1';
    const endpoint = `${sunoApiBaseUrl}/generate/get-timestamped-lyrics`;

    console.log('[get-lyrics] Fetching timestamped lyrics');
    console.log('[get-lyrics] Endpoint:', endpoint);
    console.log('[get-lyrics] TaskId:', taskId);
    console.log('[get-lyrics] AudioId:', audioId);

    try {
      const response = await axios.post(
        endpoint,
        {
          taskId,
          audioId,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[get-lyrics] SUCCESS! Response:', JSON.stringify(response.data, null, 2));
      return NextResponse.json(response.data, { status: 200 });
    } catch (error) {
      console.error('[get-lyrics] Failed to fetch lyrics:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[get-lyrics] Error response:', error.response.data);
        return NextResponse.json(
          {
            error: 'Failed to fetch lyrics from Suno API',
            details: error.response.data,
          },
          { status: error.response.status }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch lyrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
