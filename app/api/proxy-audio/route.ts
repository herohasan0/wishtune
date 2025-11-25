import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/ratelimit';

/**
 * Validates and sanitizes URLs to prevent SSRF attacks
 * Only allows URLs from trusted domains (Suno API CDN)
 */
function isValidAudioUrl(urlString: string): { valid: boolean; error?: string } {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, error: 'Invalid protocol. Only HTTP/HTTPS allowed' };
  }

  const hostname = url.hostname.toLowerCase();

  // Block localhost and loopback addresses
  if (hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('127.') ||
      hostname === '::1' ||
      hostname === '[::1]') {
    return { valid: false, error: 'Localhost URLs are not allowed' };
  }

  // Block private IP ranges (IPv4)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const [, oct1, oct2] = ipMatch.map(Number);
    // Block 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    if (oct1 === 10 ||
        (oct1 === 172 && oct2 >= 16 && oct2 <= 31) ||
        (oct1 === 192 && oct2 === 168) ||
        oct1 === 169 && oct2 === 254) { // Block cloud metadata endpoint
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
  }

  // Whitelist: Only allow known CDN domains where Suno stores audio files
  // Update this list based on where your audio files are actually hosted
  const allowedDomains = [
    'cdn1.suno.ai',
    'cdn2.suno.ai',
    'suno.ai',
    'sunoapi.org',
    // Add other trusted CDN domains as needed
  ];

  const isAllowed = allowedDomains.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return { valid: false, error: 'URL domain not in whitelist' };
  }

  return { valid: true };
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (20 requests per minute per IP)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.PROXY);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const audioUrl = searchParams.get('url');

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Validate URL to prevent SSRF attacks
    const validation = isValidAudioUrl(audioUrl);
    if (!validation.valid) {
      console.warn('Blocked invalid audio URL:', audioUrl, validation.error);
      return NextResponse.json(
        { error: validation.error || 'Invalid audio URL' },
        { status: 400 }
      );
    }

    // Fetch the audio file with timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {

      return NextResponse.json(
        { error: 'Failed to fetch audio file' },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();

    // Return the audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        // CORS headers to allow playback
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range',
      },
    });
  } catch (error) {

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while proxying audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    },
  });
}

