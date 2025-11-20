import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Used for monitoring application health and dependencies
 * Returns 200 if healthy, 503 if any critical service is down
 */
export async function GET() {
  const startTime = Date.now();
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      api: { status: 'healthy', message: 'API is responsive' },
      firebase: { status: 'unknown', message: 'Not checked' },
      environment: { status: 'unknown', message: 'Not checked' },
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check Firebase connection
    try {
      // Attempt a lightweight Firebase operation
      await db.collection('_health').doc('_check').get();
      healthStatus.checks.firebase = {
        status: 'healthy',
        message: 'Firebase connection successful',
      };
    } catch (firebaseError) {
      healthStatus.checks.firebase = {
        status: 'unhealthy',
        message: firebaseError instanceof Error ? firebaseError.message : 'Firebase connection failed',
      };
      healthStatus.status = 'degraded';
    }

    // Check critical environment variables
    const requiredEnvVars = [
      'AUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXTAUTH_URL',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      healthStatus.checks.environment = {
        status: 'unhealthy',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
      };
      healthStatus.status = 'unhealthy';
    } else {
      healthStatus.checks.environment = {
        status: 'healthy',
        message: 'All required environment variables are set',
      };
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Determine HTTP status code
    const statusCode = healthStatus.status === 'healthy' ? 200 
                     : healthStatus.status === 'degraded' ? 200 
                     : 503;

    return NextResponse.json(
      {
        ...healthStatus,
        responseTime: `${responseTime}ms`,
      },
      { 
        status: statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error) {
    // Critical error - return unhealthy status
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${Date.now() - startTime}ms`,
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

