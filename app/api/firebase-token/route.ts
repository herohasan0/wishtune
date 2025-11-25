import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAuth } from 'firebase-admin/auth';
import app from '@/lib/firebase';

/**
 * Generate Firebase custom token from NextAuth session
 * This allows client-side Firestore queries to work with security rules
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create custom token using Firebase Admin SDK
    // The UID should match what's stored in Firestore documents
    const customToken = await getAuth(app).createCustomToken(session.user.id, {
      email: session.user.email || undefined,
      name: session.user.name || undefined,
    });

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error('Error creating Firebase custom token:', error);
    return NextResponse.json(
      { error: 'Failed to create authentication token' },
      { status: 500 }
    );
  }
}
