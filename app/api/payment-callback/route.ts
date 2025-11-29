import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { generateAuthorizationForPostRequest } from '../../utils/encryp';
import { auth } from '@/auth';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { getCreditPackageById } from '@/lib/packages';

/**
 * Helper to determine the correct redirect origin.
 * Prioritizes environment variables to avoid 0.0.0.0 in production.
 */
function getRedirectOrigin(request: NextRequest): string {
  // 1. Check explicit app URL env var (Best for production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // 2. Check Vercel URL (Automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Check Host header (Good fallback)
  const host = request.headers.get('host');
  if (host) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host}`;
  }

  // 4. Fallback to nextUrl.origin (Might be 0.0.0.0 in some containers)
  return request.nextUrl.origin;
}

/**
 * Shared payment processing logic for both POST and GET callbacks
 */
async function processPayment(request: NextRequest, token: string, queryParams: Record<string, string>, body: any) {
  const origin = getRedirectOrigin(request);

  console.log('💳 Payment callback received:', {
    token,
    queryParams,
    hasBody: !!body,
    origin
  });

  try {
    // 1. Idempotency Check: Check if transaction already exists
    const transactionRef = db.collection('transactions').doc(token);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      const data = transactionDoc.data();
      if (data?.status === 'SUCCESS') {
        console.log('⚠️ Duplicate payment callback detected (already processed):', { token });
        return NextResponse.redirect(`${origin}/?payment=success`, { status: 303 });
      }
    }

    // 2. Verify Payment with Iyzico
    // https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu/cf-ornek-entegrasyon#adim-4-cf-sorgulama
    const detailRequestData = {
      locale: "en",
      token: token,
      conversationId: queryParams.conversationId || body?.conversationId || undefined,
    };
    const requestDataString = JSON.stringify(detailRequestData);
    
    const authorization = generateAuthorizationForPostRequest({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      data: requestDataString,
      uriPath: '/payment/iyzipos/checkoutform/auth/ecom/detail',
    });
    
    const iyzipayBase = axios.create({
      baseURL: process.env.IYZICO_BASE_URL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
    });
    
    const detailResponse = await iyzipayBase.post(
      'payment/iyzipos/checkoutform/auth/ecom/detail',
      detailRequestData
    );

    const detailData = detailResponse.data as {
      paymentStatus?: string;
      itemTransactions?: Array<{ itemId?: string }>;
      conversationId?: string;
      [key: string]: unknown;
    };

    console.log('🔍 Payment verification response:', {
      token,
      paymentStatus: detailData.paymentStatus,
      conversationId: detailData.conversationId,
      itemCount: detailData.itemTransactions?.length || 0
    });

    if (detailData.paymentStatus !== 'SUCCESS') {
      console.log('❌ Payment failed:', { token, status: detailData.paymentStatus });
      return NextResponse.redirect(`${origin}/?payment=failed`, { status: 303 });
    }

    // 3. Recover User Context
    const session = await auth();
    let conversationId = detailData.conversationId;
    
    // Priority: Session User ID -> Conversation ID -> Firestore Payment Session
    let userId = session?.user?.id || conversationId;
    const userEmail = session?.user?.email;

    // Fallback: Check paymentSessions collection if userId is still missing
    if (!userId) {
      console.log('🔎 User ID not found in session or conversationId, checking paymentSessions:', { token });
      try {
        const paymentSessionDoc = await db.collection('paymentSessions').doc(token).get();
        if (paymentSessionDoc.exists) {
          const sessionData = paymentSessionDoc.data();
          userId = sessionData?.userId;
          conversationId = sessionData?.conversationId; // Update conversationId if found
          console.log('✅ User ID recovered from paymentSessions:', { userId, conversationId });
        } else {
          console.log('⚠️ Payment session not found in Firestore:', { token });
        }
      } catch (error) {
        console.error('❌ Error fetching payment session:', error);
      }
    }

    if (!userId) {
      console.log('❌ User session lost, cannot process payment:', { token });
      return NextResponse.redirect(`${origin}/?error=session_lost`, { status: 303 });
    }

    // 4. Get Package Details
    const itemTransactions = detailData.itemTransactions || [];
    const itemId = itemTransactions[0]?.itemId;

    if (!itemId) {
      console.log('❌ No item ID found in payment:', { token });
      return NextResponse.redirect(`${origin}/?error=no_item_id`, { status: 303 });
    }

    const creditPackage = await getCreditPackageById(itemId);
    if (!creditPackage) {
      console.log('❌ Credit package not found:', { itemId, token });
      return NextResponse.redirect(`${origin}/?error=package_not_found`, { status: 303 });
    }

    console.log('📦 Credit package found:', {
      itemId,
      credits: creditPackage.credits,
      userId,
      token
    });

    // 5. Atomic Transaction: Record Transaction + Add Credits
    try {
      await db.runTransaction(async (t) => {
        // Re-check idempotency inside transaction for safety
        const doc = await t.get(transactionRef);
        if (doc.exists && doc.data()?.status === 'SUCCESS') {
          return;
        }

        const userCreditRef = db.collection('userCredits').doc(userId!);
        const userCreditSnap = await t.get(userCreditRef);
        
        if (userCreditSnap.exists) {
          t.update(userCreditRef, {
            paidCredits: FieldValue.increment(creditPackage.credits),
            updatedAt: FieldValue.serverTimestamp(),
            // Only update email if we have it from session to avoid overwriting with null
            ...(userEmail ? { email: userEmail } : {})
          });
        } else {
          t.set(userCreditRef, {
            userId: userId,
            email: userEmail || null,
            freeSongsUsed: 0,
            paidCredits: creditPackage.credits,
            totalSongsCreated: 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        t.set(transactionRef, {
          status: 'SUCCESS',
          itemId: itemId,
          userId: userId,
          credits: creditPackage.credits,
          timestamp: FieldValue.serverTimestamp(),
          providerResponse: detailData
        });
      });

      console.log('✅ Payment processed successfully:', {
        token,
        userId,
        credits: creditPackage.credits,
        itemId
      });
      return NextResponse.redirect(`${origin}/?payment=success`, { status: 303 });

    } catch (error) {
      console.error('❌ Transaction failed:', { token, userId, error });
      return NextResponse.redirect(`${origin}/?error=transaction_failed`, { status: 303 });
    }

  } catch (error) {
    console.error('❌ Payment processing failed:', { token, error });
    return NextResponse.redirect(`${origin}/?error=processing_failed`, { status: 303 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = request.url;
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    let body: Record<string, unknown> | null = null;
    let bodyText: string = '';
    
    try {
      bodyText = await request.text();
      if (bodyText) {
        try {
          body = JSON.parse(bodyText) as Record<string, unknown>;
        } catch {
          try {
            const formData = new URLSearchParams(bodyText);
            const formParams: Record<string, string> = {};
            formData.forEach((value, key) => {
              formParams[key] = value;
            });
            body = formParams;
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing POST request body:', error);
    }

    const token = (body?.token as string | undefined) || queryParams?.token;

    if (!token) {
      console.log('⚠️ POST callback received without token:', { queryParams, hasBody: !!body });
      return NextResponse.json({
        success: false,
        message: 'No token found in callback',
        received: { queryParams, body: body || bodyText || null }
      }, { status: 400 });
    }

    return processPayment(request, token, queryParams, body);

  } catch (error) {
    console.error('❌ POST callback handler error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryParams: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  
  const token = queryParams.token;
  
  if (!token) {
    return NextResponse.json({ 
      message: 'Payment callback endpoint is active',
      method: 'POST or GET with token',
      description: 'This endpoint receives callbacks from iyzico after payment processing'
    });
  }

  return processPayment(request, token, queryParams, null);
}
