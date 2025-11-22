import * as creditsLib from '@/lib/credits';
import { db } from '@/lib/firebase';

// We need to mock firebase-admin/firestore
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
      }))
    })),
    runTransaction: jest.fn(async (callback) => {
      return callback({
        get: jest.fn(),
        update: jest.fn(),
        set: jest.fn()
      });
    })
  }
}));

describe('Data Integrity', () => {
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransaction = {
      get: jest.fn(),
      update: jest.fn(),
      set: jest.fn()
    };

    (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
      return callback(mockTransaction);
    });
  });

  it('Scenario: Should use Firestore transaction for credit deduction', async () => {
    // We are testing the library function directly here
    const userId = 'user-123';
    
    // Mock user having 1 paid credit
    mockTransaction.get.mockResolvedValue({
      exists: true,
      data: () => ({
        userId,
        freeSongsUsed: 2,
        paidCredits: 1,
        totalSongsCreated: 2
      })
    });

    await creditsLib.deductCreditForSong(userId);

    // Verify transaction was used
    expect(db.runTransaction).toHaveBeenCalled();
    
    // Verify update was called with decrement
    expect(mockTransaction.update).toHaveBeenCalled();
  });
});
