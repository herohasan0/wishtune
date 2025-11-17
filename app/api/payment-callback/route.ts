import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { generateAuthorizationForPostRequest } from '../../utils/encryp';
import { auth } from '@/auth';
import { addPaidCredits } from '@/lib/credits';
import { getCreditPackageById } from '@/lib/packages';

/**
 * Payment callback endpoint for iyzico
 * This endpoint receives callbacks after payment processing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Payment callback received from iyzico');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Log request URL and query parameters
    const url = request.url;
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    console.log('📍 Request URL:', url);
    console.log('🔍 Query Parameters:', JSON.stringify(queryParams, null, 2));
    
    // Log headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    
    // Try to get body as JSON first
    let body: Record<string, unknown> | null = null;
    let bodyText: string = '';
    
    try {
      bodyText = await request.text();
      console.log('📦 Raw Body (text):', bodyText);
      
      // Try to parse as JSON
      if (bodyText) {
        try {
          body = JSON.parse(bodyText) as Record<string, unknown>;
          console.log('📦 Body (JSON):', JSON.stringify(body, null, 2));
        } catch {
          // If not JSON, try to parse as URL-encoded form data
          try {
            const formData = new URLSearchParams(bodyText);
            const formParams: Record<string, string> = {};
            formData.forEach((value, key) => {
              formParams[key] = value;
            });
            body = formParams;
            console.log('📦 Body (Form Data):', JSON.stringify(body, null, 2));
          } catch {
            console.log('📦 Body (could not parse as JSON or Form Data)');
          }
        }
      }
    } catch (error) {
      console.log('❌ Error reading body:', error);
    }
    
    // Log all request details together
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 COMPLETE CALLBACK DATA SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', url);
    console.log('Query Params:', queryParams);
    console.log('Headers:', headers);
    console.log('Body:', body || bodyText || '(empty)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Extract token from body
    const token = (body?.token as string | undefined) || queryParams?.token;
    
    if (!token) {
      console.log('⚠️ No token found in callback');
      return NextResponse.json({ 
        success: false,
        message: 'No token found in callback',
        received: {
          queryParams,
          body: body || bodyText || null,
        }
      }, { status: 400 });
    }
    
    console.log('🎫 Extracted token:', token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 Making request to iyzico detail endpoint...');
    
    // Prepare request data
    const detailRequestData = {
      token: token
    };
    
    const requestDataString = JSON.stringify(detailRequestData);
    
    // Generate authorization header
    const authorization = generateAuthorizationForPostRequest({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      data: requestDataString,
      uriPath: '/payment/iyzipos/checkoutform/auth/ecom/detail',
    });
    
    console.log('🔐 Authorization header generated');
    console.log('📤 Request data:', requestDataString);
    
    // Make request to iyzico detail endpoint
    const iyzipayBase = axios.create({
      baseURL: process.env.IYZICO_BASE_URL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
    });
    
    try {
      const detailResponse = await iyzipayBase.post(
        'payment/iyzipos/checkoutform/auth/ecom/detail',
        detailRequestData
      );
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ IYZICO DETAIL API RESPONSE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Status:', detailResponse.status);
      console.log('Status Text:', detailResponse.statusText);
      console.log('Response Data:', JSON.stringify(detailResponse.data, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const detailData = detailResponse.data as {
        paymentStatus?: string;
        itemTransactions?: Array<{ itemId?: string }>;
        [key: string]: unknown;
      };
      
      // Check if payment was successful
      if (detailData.paymentStatus === 'SUCCESS') {
        console.log('✅ Payment status is SUCCESS - processing credit addition...');
        
        // Get user session
        const session = await auth();
        
        if (!session?.user?.id) {
          console.error('❌ No user session found');
          // Return HTML page that redirects to login, then back to home
          return new NextResponse(
            `<!DOCTYPE html>
<html>
<head>
  <title>Payment Successful</title>
  <meta http-equiv="refresh" content="3;url=/" />
</head>
<body>
  <h1>Payment Successful!</h1>
  <p>Please sign in to receive your credits. Redirecting...</p>
  <script>setTimeout(() => window.location.href = '/', 3000);</script>
</body>
</html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            }
          );
        }
        
        // Extract itemId from itemTransactions
        const itemTransactions = detailData.itemTransactions || [];
        if (itemTransactions.length === 0) {
          console.error('❌ No item transactions found');
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=no_items`, { status: 303 });
        }
        
        const itemId = itemTransactions[0]?.itemId;
        if (!itemId) {
          console.error('❌ No itemId found in transactions');
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=no_item_id`, { status: 303 });
        }
        
        console.log('📦 Item ID:', itemId);
        
        // Get the package to find credit amount
        const creditPackage = await getCreditPackageById(itemId);
        if (!creditPackage) {
          console.error(`❌ Package not found for itemId: ${itemId}`);
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=package_not_found`, { status: 303 });
        }
        
        console.log(`💰 Adding ${creditPackage.credits} credits to user ${session.user.id}`);
        
        // Add credits to user account
        const addCreditsResult = await addPaidCredits(
          session.user.id,
          creditPackage.credits,
          session.user.email || undefined
        );
        
        if (!addCreditsResult.success) {
          console.error('❌ Failed to add credits:', addCreditsResult.error);
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=credit_add_failed`, { status: 303 });
        }
        
        console.log(`✅ Successfully added ${creditPackage.credits} credits to user account`);
        
        // Redirect to create song page (home page) with 303 status to force GET method
        const origin = request.nextUrl.origin;
        return NextResponse.redirect(`${origin}/?payment=success`, { status: 303 });
      } else {
        console.log(`⚠️ Payment status is not SUCCESS: ${detailData.paymentStatus}`);
        // Redirect to home page with error
        const origin = request.nextUrl.origin;
        return NextResponse.redirect(`${origin}/?payment=failed`, { status: 303 });
      }
      
    } catch (detailError: unknown) {
      const axiosError = detailError as { response?: { data?: unknown; status?: number }; message?: string };
      console.error('❌ Error calling iyzico detail endpoint:', detailError);
      console.error('Error response:', axiosError?.response?.data);
      console.error('Error status:', axiosError?.response?.status);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to call iyzico detail endpoint',
          callbackData: {
            queryParams,
            body: body || bodyText || null,
          },
          detailError: {
            message: axiosError?.message,
            response: axiosError?.response?.data,
            status: axiosError?.response?.status
          }
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error processing payment callback:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process payment callback',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Also handle GET requests (when iyzico redirects user back)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryParams: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  
  console.log('🔍 GET request to payment-callback');
  console.log('Query Parameters:', JSON.stringify(queryParams, null, 2));
  
  // If token is provided in query params, process the payment
  const token = queryParams.token;
  if (token) {
    console.log('🎫 Token found in GET request, processing payment...');
    
    try {
      // Prepare request data
      const detailRequestData = {
        token: token
      };
      
      const requestDataString = JSON.stringify(detailRequestData);
      
      // Generate authorization header
      const authorization = generateAuthorizationForPostRequest({
        apiKey: process.env.IYZICO_API_KEY!,
        secretKey: process.env.IYZICO_SECRET_KEY!,
        data: requestDataString,
        uriPath: '/payment/iyzipos/checkoutform/auth/ecom/detail',
      });
      
      // Make request to iyzico detail endpoint
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
        [key: string]: unknown;
      };
      
      // Check if payment was successful
      if (detailData.paymentStatus === 'SUCCESS') {
        console.log('✅ Payment status is SUCCESS - processing credit addition...');
        
        // Get user session
        const session = await auth();
        
        if (!session?.user?.id) {
          console.error('❌ No user session found');
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=no_session`, { status: 303 });
        }
        
        // Extract itemId from itemTransactions
        const itemTransactions = detailData.itemTransactions || [];
        if (itemTransactions.length === 0) {
          console.error('❌ No item transactions found');
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=no_items`, { status: 303 });
        }
        
        const itemId = itemTransactions[0]?.itemId;
        if (!itemId) {
          console.error('❌ No itemId found in transactions');
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=no_item_id`, { status: 303 });
        }
        
        console.log('📦 Item ID:', itemId);
        
        // Get the package to find credit amount
        const creditPackage = await getCreditPackageById(itemId);
        if (!creditPackage) {
          console.error(`❌ Package not found for itemId: ${itemId}`);
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=package_not_found`, { status: 303 });
        }
        
        console.log(`💰 Adding ${creditPackage.credits} credits to user ${session.user.id}`);
        
        // Add credits to user account
        const addCreditsResult = await addPaidCredits(
          session.user.id,
          creditPackage.credits,
          session.user.email || undefined
        );
        
        if (!addCreditsResult.success) {
          console.error('❌ Failed to add credits:', addCreditsResult.error);
          const origin = request.nextUrl.origin;
          return NextResponse.redirect(`${origin}/?error=credit_add_failed`, { status: 303 });
        }
        
        console.log(`✅ Successfully added ${creditPackage.credits} credits to user account`);
        
        // Redirect to create song page (home page) with 303 status to force GET method
        const origin = request.nextUrl.origin;
        return NextResponse.redirect(`${origin}/?payment=success`, { status: 303 });
      } else {
        console.log(`⚠️ Payment status is not SUCCESS: ${detailData.paymentStatus}`);
        const origin = request.nextUrl.origin;
        return NextResponse.redirect(`${origin}/?payment=failed`, { status: 303 });
      }
    } catch (error) {
      console.error('❌ Error processing GET payment callback:', error);
      const origin = request.nextUrl.origin;
      return NextResponse.redirect(`${origin}/?error=processing_failed`, { status: 303 });
    }
  }
  
  // No token, just return info
  return NextResponse.json({ 
    message: 'Payment callback endpoint is active',
    method: 'POST or GET with token',
    description: 'This endpoint receives callbacks from iyzico after payment processing',
    testQueryParams: queryParams
  });
}

