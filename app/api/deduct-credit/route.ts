import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deductCreditForSong } from '@/lib/credits';

/**
 * POST /api/deduct-credit - Deduct credits when song is successfully created
 * Body: { variationCount: number } - Number of variations (songs) to deduct credits for
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

    const body = await request.json();
    const variationCount = body.variationCount || 1;

    if (typeof variationCount !== 'number' || variationCount <= 0) {
      return NextResponse.json(
        { error: 'Invalid variation count' },
        { status: 400 }
      );
    }

    const deductResult = await deductCreditForSong(session.user.id, session.user.email, variationCount);
    
    if (!deductResult.success) {
      return NextResponse.json(
        { error: deductResult.error || 'Failed to deduct credit' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error deducting credit:', error);
    return NextResponse.json(
      { 
        error: 'Failed to deduct credit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

