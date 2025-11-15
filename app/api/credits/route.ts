import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserCredits } from '@/lib/credits';

/**
 * GET /api/credits - Get user's credit information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const credits = await getUserCredits(session.user.id);
    
    return NextResponse.json({
      credits: {
        freeSongsUsed: credits.freeSongsUsed,
        freeSongsRemaining: Math.max(0, 2 - credits.freeSongsUsed),
        paidCredits: credits.paidCredits,
        totalSongsCreated: credits.totalSongsCreated,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching credits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch credits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

