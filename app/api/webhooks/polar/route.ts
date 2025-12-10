import { Webhooks } from '@polar-sh/nextjs';
import { addPaidCredits } from '@/lib/credits';

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? '',
  onPayload: async (payload) => {


    switch (payload.type) {
      case 'order.paid':

        // fall through to same logic as checkout.created if structure matches, or copy logic.
        // The payload structure in the log matches what we need: payload.data.metadata.userId/credits
        const orderData = payload.data;
        const metadata = orderData.metadata as Record<string, string>;
        const userId = metadata?.userId;
        const creditsToCheck = parseInt(metadata?.credits || '0', 10);



        if (userId && creditsToCheck > 0) {

          try {
              const result = await addPaidCredits(userId, creditsToCheck);
              if (result.success) {

              } else {
                console.error(`Failed to add credits logic error:`, result.error);
              }
          } catch (error) {
              console.error(`Failed to add credits exception to user ${userId}:`, error);
              throw error;
          }
        } else {
           console.warn('Order paid but missing userId or credits metadata', { userId, creditsToCheck });
        }
        break;

      case 'checkout.created':
        // Keep this logging just in case, but it seems order.paid is the one firing with success

        if (payload.data.status === 'succeeded') {
           // It's possible we get both. To be safe/idempotent, we relies on addPaidCredits being an increment.
           // However, if we get BOTH events, we might double count.
           // Usually 'order.paid' is the definitive "money moved" event. 'checkout.created' is "session started". 
           // If checkout.created comes with 'succeeded' it might be redundant.
           // Let's stick to 'order.paid' as the primary trigger based on the logs.

        }
        break;
        
      case 'order.created':

        break;

      default:

    }
  },
});
