/**
 * Cost Monitoring and Analytics
 *
 * Track API usage and costs for better budget management
 */

import { db } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';

interface ApiUsageLog {
  endpoint: string;
  userId?: string;
  visitorId?: string;
  timestamp: Date;
  cost?: number; // Estimated cost in credits
  success: boolean;
  duration?: number; // Response time in ms
}

/**
 * Log API usage for cost monitoring
 */
export async function logApiUsage(data: ApiUsageLog): Promise<void> {
  try {
    // Only log in production or when explicitly enabled
    if (process.env.ENABLE_COST_MONITORING !== 'true') {
      return;
    }

    const logsRef = db.collection('api_usage_logs');

    await logsRef.add({
      ...data,
      timestamp: FieldValue.serverTimestamp(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('Failed to log API usage:', error);
  }
}

/**
 * Get daily usage stats (for dashboard/monitoring)
 */
export async function getDailyUsageStats(date?: Date): Promise<{
  totalSongs: number;
  totalCost: number;
  uniqueUsers: number;
}> {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const logsRef = db.collection('api_usage_logs');
  const snapshot = await logsRef
    .where('timestamp', '>=', startOfDay)
    .where('timestamp', '<=', endOfDay)
    .where('endpoint', '==', 'create-song')
    .get();

  const uniqueUsers = new Set<string>();
  let totalCost = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.userId) uniqueUsers.add(data.userId);
    if (data.visitorId) uniqueUsers.add(data.visitorId);
    totalCost += data.cost || 0;
  });

  return {
    totalSongs: snapshot.size,
    totalCost,
    uniqueUsers: uniqueUsers.size,
  };
}

/**
 * Check if daily budget limit is exceeded
 */
export async function checkDailyBudget(): Promise<{
  exceeded: boolean;
  current: number;
  limit: number;
}> {
  const dailyLimit = parseInt(process.env.DAILY_COST_LIMIT || '1000', 10);
  const stats = await getDailyUsageStats();

  return {
    exceeded: stats.totalCost >= dailyLimit,
    current: stats.totalCost,
    limit: dailyLimit,
  };
}
