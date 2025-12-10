import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { auth } from '@/auth';
import { getCreditPackageById } from '@/lib/packages';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate environment
    if (!process.env.POLAR_ACCESS_TOKEN) {
      console.error('POLAR_ACCESS_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    // 2. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { packageId, billingDetails } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // 4. Validate package exists
    const creditPackage = await getCreditPackageById(packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // 5. Get product ID (use polarProductId if exists, else use packageId)
    // Note: getCreditPackageById now handles the mapping internally clearly
    const polarProductId = creditPackage.polarProductId || packageId;

    // 6. Initialize Polar SDK
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    });

    // 7. Create checkout session
    const checkout = await polar.checkouts.create({
      products: [polarProductId],
      customerEmail: session.user.email || undefined,
      customerName: billingDetails?.fullName || undefined,
      customerBillingAddress: billingDetails ? {
        line1: billingDetails.address || undefined,
        city: billingDetails.city || undefined,
        country: billingDetails.country || undefined, // This is now a 2-letter code
      } : undefined,
      metadata: {
        userId: session.user.id,
        packageId: packageId,
        credits: creditPackage.credits.toString(),
      },
      successUrl: "https://wishtune.ai/?payment=success",
      embedOrigin: "https://wishtune.ai", // Required for embedded checkout

    });



    return NextResponse.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Checkout creation error:', {
        message: error?.message,
        stack: error?.stack,
        details: error?.response?.data || error?.cause,
    });
    return NextResponse.json(
      {
        error: 'Failed to create checkout',
        message: error?.message || 'Unknown error',
        details: error?.response?.data || undefined,
      },
      { status: 500 }
    );
  }
}
