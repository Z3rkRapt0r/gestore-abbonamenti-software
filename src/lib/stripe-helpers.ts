import { stripe } from './stripe';

export interface StripeDeletionResult {
  success: boolean;
  subscriptionCanceled?: boolean;
  customerDeleted?: boolean;
  errors?: string[];
}

/**
 * Cancella completamente un cliente da Stripe
 * 1. Cancella la subscription (se esiste)
 * 2. Elimina il customer
 */
export async function deleteCustomerFromStripe(
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<StripeDeletionResult> {
  const result: StripeDeletionResult = {
    success: true,
    errors: []
  };

  if (!stripe) {
    result.errors?.push('Stripe non configurato');
    result.success = false;
    return result;
  }

  try {
    // 1. Cancella la subscription se esiste
    if (stripeSubscriptionId) {
      try {
        console.log(`🔄 Cancellando subscription: ${stripeSubscriptionId}`);
        await stripe.subscriptions.cancel(stripeSubscriptionId);
        result.subscriptionCanceled = true;
        console.log(`✅ Subscription cancellata: ${stripeSubscriptionId}`);
      } catch (error) {
        const errorMsg = `Errore cancellazione subscription ${stripeSubscriptionId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        result.errors?.push(errorMsg);
        // Non fermiamo il processo se la subscription non esiste più
      }
    }

    // 2. Elimina il customer se esiste
    if (stripeCustomerId) {
      try {
        console.log(`🔄 Eliminando customer: ${stripeCustomerId}`);
        await stripe.customers.del(stripeCustomerId);
        result.customerDeleted = true;
        console.log(`✅ Customer eliminato: ${stripeCustomerId}`);
      } catch (error) {
        const errorMsg = `Errore eliminazione customer ${stripeCustomerId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        result.errors?.push(errorMsg);
        result.success = false;
      }
    }

    // Se non ci sono customer/subscription da cancellare, è comunque un successo
    if (!stripeCustomerId && !stripeSubscriptionId) {
      console.log('ℹ️ Nessun dato Stripe da cancellare');
      result.success = true;
    }

  } catch (error) {
    const errorMsg = `Errore generale cancellazione Stripe: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ ${errorMsg}`);
    result.errors?.push(errorMsg);
    result.success = false;
  }

  return result;
}

/**
 * Cancella solo la subscription (mantiene il customer)
 */
export async function cancelSubscriptionOnly(
  stripeSubscriptionId: string
): Promise<StripeDeletionResult> {
  const result: StripeDeletionResult = {
    success: true,
    errors: []
  };

  if (!stripe) {
    result.errors?.push('Stripe non configurato');
    result.success = false;
    return result;
  }

  try {
    console.log(`🔄 Cancellando subscription: ${stripeSubscriptionId}`);
    await stripe.subscriptions.cancel(stripeSubscriptionId);
    result.subscriptionCanceled = true;
    console.log(`✅ Subscription cancellata: ${stripeSubscriptionId}`);
  } catch (error) {
    const errorMsg = `Errore cancellazione subscription: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ ${errorMsg}`);
    result.errors?.push(errorMsg);
    result.success = false;
  }

  return result;
}
