import { NextRequest, NextResponse } from 'next/server';

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
    let body: any = null;
    let bodyText: string = '';
    
    try {
      bodyText = await request.text();
      console.log('📦 Raw Body (text):', bodyText);
      
      // Try to parse as JSON
      if (bodyText) {
        try {
          body = JSON.parse(bodyText);
          console.log('📦 Body (JSON):', JSON.stringify(body, null, 2));
        } catch (e) {
          // If not JSON, try to parse as URL-encoded form data
          try {
            const formData = new URLSearchParams(bodyText);
            const formParams: Record<string, string> = {};
            formData.forEach((value, key) => {
              formParams[key] = value;
            });
            body = formParams;
            console.log('📦 Body (Form Data):', JSON.stringify(body, null, 2));
          } catch (e2) {
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
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Payment callback received and logged',
      received: {
        queryParams,
        body: body || bodyText || null,
        headers: Object.keys(headers).length > 0 ? headers : null
      }
    }, { status: 200 });
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

// Also handle GET requests for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryParams: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  
  console.log('🔍 GET request to payment-callback');
  console.log('Query Parameters:', JSON.stringify(queryParams, null, 2));
  
  return NextResponse.json({ 
    message: 'Payment callback endpoint is active',
    method: 'POST',
    description: 'This endpoint receives callbacks from iyzico after payment processing',
    testQueryParams: queryParams
  });
}

