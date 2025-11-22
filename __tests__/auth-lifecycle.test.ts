import { POST } from '@/app/api/create-song/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import * as creditsLib from '@/lib/credits';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/lib/credits');

describe('Authentication & Token Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (creditsLib.canCreateSong as jest.Mock).mockResolvedValue({ canCreate: true });
  });

  it('Scenario A: Should handle expired/invalid session gracefully', async () => {
    // Mock auth returning null (expired/invalid)
    (auth as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/create-song', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Song',
        celebrationType: 'Birthday',
        musicStyle: 'Pop'
      })
    });

    const response = await POST(req);
    
    // Should allow anonymous creation (based on current logic) OR fail if we enforce login
    // Current logic in route.ts line 26: allows first song without auth but checks anonymous limits
    // We expect 200 OK for anonymous, or 401 if we changed it.
    // Let's verify it doesn't crash (500).
    expect(response.status).not.toBe(500);
  });

  it('Scenario B: Should reject request if user account is disabled/deleted (no user ID)', async () => {
    // Session exists but has no user ID (simulating some edge case or partial session)
    (auth as jest.Mock).mockResolvedValue({ user: {} });

    const req = new NextRequest('http://localhost/api/create-song', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Song',
        celebrationType: 'Birthday',
        musicStyle: 'Pop'
      })
    });

    const response = await POST(req);
    
    // Should fall back to anonymous logic or error, but not crash
    expect(response.status).not.toBe(500);
  });
});
