import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deductCreditForSong } from '@/lib/credits';

/**
 * POST /api/deduct-credit - Deduct credits when song is successfully created
 * Always deducts exactly 1 credit per song, regardless of variations
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

    const deductResult = await deductCreditForSong(session.user.id, session.user.email);
    
    if (!deductResult.success) {
      return NextResponse.json(
        { error: deductResult.error || 'Failed to deduct credit' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { 
        error: 'Failed to deduct credit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

