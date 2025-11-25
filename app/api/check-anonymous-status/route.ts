import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const visitorId = searchParams.get('visitorId');

  if (!visitorId) {
    return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
  }

  try {
    const doc = await db.collection('anonymous_usages').doc(visitorId).get();
    return NextResponse.json({ used: doc.exists });
  } catch (error) {
    console.error('Error checking anonymous status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
