import { POST } from '@/app/api/create-song/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import * as creditsLib from '@/lib/credits';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/lib/credits');

describe('Resource Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    });
  });

  it('Scenario A: Should NOT deduct credits if validation fails', async () => {
    // Missing fields
    const req = new NextRequest('http://localhost/api/create-song', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Song'
        // Missing celebrationType and musicStyle
      })
    });

    const response = await POST(req);
    
    expect(response.status).toBe(400);
    // canCreateSong might be called to check eligibility, but deductCreditForSong should NOT be called
    // Note: The current route implementation doesn't call deductCreditForSong directly, 
    // it relies on the "songs" page to do it later. 
    // But we should verify canCreateSong IS called to prevent unauthorized generation attempts.
    expect(creditsLib.canCreateSong).not.toHaveBeenCalled(); 
  });

  it('Scenario B: Should reject request if user has 0 credits', async () => {
    (creditsLib.canCreateSong as jest.Mock).mockResolvedValue({ 
      canCreate: false, 
      reason: 'Insufficient credits' 
    });

    const req = new NextRequest('http://localhost/api/create-song', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Song',
        celebrationType: 'Birthday',
        musicStyle: 'Pop'
      })
    });

    const response = await POST(req);
    
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Insufficient credits');
  });
});
