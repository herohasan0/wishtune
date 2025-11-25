import crypto from 'crypto';

/**
 * Webhook Security Utilities
 *
 * Provides signature verification for incoming webhooks to ensure they
 * come from trusted sources and haven't been tampered with.
 */

export interface WebhookVerificationConfig {
  /**
   * Secret key used to sign the webhook
   */
  secret: string;

  /**
   * Algorithm to use for HMAC (default: sha256)
   */
  algorithm?: string;

  /**
   * Header name where signature is sent (default: x-webhook-signature)
   */
  signatureHeader?: string;

  /**
   * Timestamp header for replay attack prevention (optional)
   */
  timestampHeader?: string;

  /**
   * Maximum age of webhook in seconds (default: 300 = 5 minutes)
   */
  maxAge?: number;
}

/**
 * Verify webhook signature using HMAC
 *
 * @param payload - Raw request body as string
 * @param signature - Signature from webhook header
 * @param config - Verification configuration
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  config: WebhookVerificationConfig
): boolean {
  try {
    const algorithm = config.algorithm || 'sha256';

    // Compute expected signature
    const hmac = crypto.createHmac(algorithm, config.secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Verify webhook timestamp to prevent replay attacks
 *
 * @param timestamp - Timestamp from webhook header (in seconds)
 * @param maxAge - Maximum age in seconds
 * @returns true if timestamp is recent enough
 */
export function verifyWebhookTimestamp(
  timestamp: string | number,
  maxAge: number = 300
): boolean {
  try {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    const now = Math.floor(Date.now() / 1000);
    const age = now - ts;

    return age >= 0 && age <= maxAge;
  } catch (error) {
    console.error('Webhook timestamp verification failed:', error);
    return false;
  }
}

/**
 * Extract and verify webhook from request
 *
 * @param request - Next.js request object
 * @param body - Raw request body as string
 * @param config - Verification configuration
 * @returns Verification result
 */
export async function verifyWebhookRequest(
  request: Request,
  body: string,
  config: WebhookVerificationConfig
): Promise<{ valid: boolean; error?: string }> {
  const signatureHeader = config.signatureHeader || 'x-webhook-signature';
  const signature = request.headers.get(signatureHeader);

  if (!signature) {
    return {
      valid: false,
      error: `Missing signature header: ${signatureHeader}`,
    };
  }

  // Verify signature
  const signatureValid = verifyWebhookSignature(body, signature, config);
  if (!signatureValid) {
    return {
      valid: false,
      error: 'Invalid webhook signature',
    };
  }

  // Verify timestamp if configured
  if (config.timestampHeader) {
    const timestamp = request.headers.get(config.timestampHeader);
    if (!timestamp) {
      return {
        valid: false,
        error: `Missing timestamp header: ${config.timestampHeader}`,
      };
    }

    const timestampValid = verifyWebhookTimestamp(timestamp, config.maxAge);
    if (!timestampValid) {
      return {
        valid: false,
        error: 'Webhook timestamp is too old or invalid',
      };
    }
  }

  return { valid: true };
}

/**
 * Generate webhook signature for testing
 * (Useful for development/testing)
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  algorithm: string = 'sha256'
): string {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload);
  return hmac.digest('hex');
}
