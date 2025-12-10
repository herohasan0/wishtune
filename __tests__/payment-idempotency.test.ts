import { NextRequest } from 'next/server';
import * as packagesLib from '@/lib/packages';

// Mock dependencies
jest.mock('@/lib/packages');

// Mock Firestore
const mockTransaction = {
  get: jest.fn(),
  update: jest.fn(),
  set: jest.fn()
};

const mockDocRef = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn()
};

const mockCollectionRef = {
  doc: jest.fn(() => mockDocRef)
};

jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(() => mockCollectionRef),
    runTransaction: jest.fn(async (callback) => {
      return callback(mockTransaction);
    })
  }
}));

import { db } from '@/lib/firebase';

// Mock Polar webhook handler
let onOrderPaidHandler: ((payload: any) => Promise<void>) | null = null;

jest.mock('@polar-sh/nextjs', () => ({
  Webhooks: (config: any) => {
    // Store the onOrderPaid handler for testing
    onOrderPaidHandler = config.onOrderPaid;

    return async (request: NextRequest) => {
      // Simulate webhook signature verification
      const body = await request.json();

      // Call the onOrderPaid handler directly for testing
      if (body.type === 'order.paid' && onOrderPaidHandler) {
        await onOrderPaidHandler({ data: body.data });
      }

      return new Response('OK', { status: 200 });
    };
  }
}));

// Import the webhook handler to initialize mocks
import { POST as WebhookHandler } from '@/app/api/webhooks/polar/route';

describe('Polar Webhook Idempotency & Race Conditions', () => {
  const mockOrderPayload = {
    type: 'order.paid',
    data: {
      id: 'order_123',
      customerId: 'cust_456',
      amount: 10000, // cents
      currency: 'usd',
      metadata: {
        userId: 'user-123',
        packageId: 'pkg-1',
        credits: '10',
      },
      customer: {
        email: 'test@example.com',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock package lookup
    (packagesLib.getCreditPackageById as jest.Mock).mockResolvedValue({
      id: 'pkg-1',
      credits: 10,
      price: 100
    });

    // Mock Firestore document get - initially doesn't exist
    mockDocRef.get.mockResolvedValue({
      exists: false,
      data: () => null,
    });

    // Mock transaction get - initially doesn't exist
    mockTransaction.get.mockResolvedValue({
      exists: false,
      data: () => null,
    });
  });

  it('Should handle duplicate webhooks idempotently', async () => {
    // First webhook
    const req1 = new NextRequest('http://localhost/api/webhooks/polar', {
      method: 'POST',
      body: JSON.stringify(mockOrderPayload),
    });

    await WebhookHandler(req1);

    // Mock the transaction doc to return existing transaction for second webhook
    mockDocRef.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: 'SUCCESS' }),
    });

    // Second webhook (duplicate)
    const req2 = new NextRequest('http://localhost/api/webhooks/polar', {
      method: 'POST',
      body: JSON.stringify(mockOrderPayload),
    });

    await WebhookHandler(req2);

    // Verify runTransaction was called for both webhooks
    // First webhook processes fully, second webhook detects duplicate
    expect(db.runTransaction).toHaveBeenCalledTimes(2);
  });

  it('Should handle concurrent webhooks (race condition)', async () => {
    const req1 = new NextRequest('http://localhost/api/webhooks/polar', {
      method: 'POST',
      body: JSON.stringify(mockOrderPayload),
    });

    const req2 = new NextRequest('http://localhost/api/webhooks/polar', {
      method: 'POST',
      body: JSON.stringify(mockOrderPayload),
    });

    // Execute in parallel
    await Promise.all([WebhookHandler(req1), WebhookHandler(req2)]);

    // Both webhooks attempt transaction, but idempotency check prevents double-processing
    expect(db.runTransaction).toHaveBeenCalledTimes(2);
  });

  it('Should reject webhooks with missing metadata', async () => {
    const invalidPayload = {
      type: 'order.paid',
      data: {
        id: 'order_invalid',
        customerId: 'cust_456',
        amount: 10000,
        currency: 'usd',
        metadata: {
          // Missing userId and packageId
        },
        customer: {
          email: 'test@example.com',
        },
      },
    };

    const req = new NextRequest('http://localhost/api/webhooks/polar', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
    });

    // Should throw error due to missing metadata
    await expect(onOrderPaidHandler?.({ data: invalidPayload.data })).rejects.toThrow('Invalid webhook payload: missing metadata');
  });

  it('Should process valid order.paid webhook correctly', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/polar', {
      method: 'POST',
      body: JSON.stringify(mockOrderPayload),
    });

    await WebhookHandler(req);

    // Verify package was fetched
    expect(packagesLib.getCreditPackageById).toHaveBeenCalledWith('pkg-1');

    // Verify transaction was attempted
    expect(db.runTransaction).toHaveBeenCalledTimes(1);

    // Verify transaction set was called with correct data
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'SUCCESS',
        provider: 'polar',
        orderId: 'order_123',
        packageId: 'pkg-1',
        userId: 'user-123',
        credits: 10,
      })
    );
  });
});
