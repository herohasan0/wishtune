import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteSong } from '@/lib/songs';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('id');

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteSong(songId, session.user.id);

    if (!result.success) {
      if (result.error === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      if (result.error === 'Song not found') {
        return NextResponse.json(
          { error: 'Song not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: result.error || 'Failed to delete song' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
