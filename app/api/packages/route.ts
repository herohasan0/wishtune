import { NextRequest, NextResponse } from 'next/server';
import { getCreditPackages } from '@/lib/packages';

/**
 * GET /api/packages - Get all active credit packages
 */
export async function GET(request: NextRequest) {
  try {
    const packages = await getCreditPackages();
    
    return NextResponse.json({
      packages,
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching credit packages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch credit packages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

