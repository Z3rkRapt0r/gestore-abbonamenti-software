import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/database";
import { headers } from "next/headers";
import Stripe from "stripe";

// POST /api/stripe/webhook - Gestisce eventi webhook da Stripe
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe non configurato" }, { status: 500 });
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Received Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriberId = session.metadata?.subscriber_id;
  
  if (!subscriberId) {
    console.error("No subscriber_id in checkout session metadata");
    return;
  }

  console.log(`Checkout completed for subscriber: ${subscriberId}`);
  
  // Il subscriber viene aggiornato quando arriva l'evento subscription.created
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const subscriberId = subscription.metadata?.subscriber_id;
  
  console.log(`🔍 Subscription created - subscriber_id: ${subscriberId}`);
  console.log(`🔍 Subscription metadata:`, subscription.metadata);
  
  if (!subscriberId) {
    console.error("No subscriber_id in subscription metadata");
    return;
  }

  console.log(`🔍 Looking for subscriber with ID: ${subscriberId}`);
  
  // Debug: verifica tutti i subscriber disponibili
  const allSubscribers = await db.getSubscribers();
  console.log(`🔍 Total subscribers in database: ${allSubscribers?.length || 0}`);
  if (allSubscribers) {
    allSubscribers.forEach(sub => {
      console.log(`🔍 Subscriber: ${sub.id} - ${sub.email}`);
    });
  }
  
  const subscriber = await db.getSubscriberById(subscriberId);
  if (!subscriber) {
    console.error(`❌ Subscriber not found: ${subscriberId}`);
    console.log(`🔍 Available subscriber IDs:`, allSubscribers?.map(s => s.id) || []);
    return;
  }
  
  console.log(`✅ Subscriber found: ${subscriber.email}`);

  // Calcola la prossima data di fatturazione (stessa logica dell'endpoint debug)
  const currentPeriodEnd = (subscription as any).current_period_end;
  const trialEnd = (subscription as any).trial_end;
  const created = (subscription as any).created;
  
  let nextBillingDate = null;
  if (currentPeriodEnd) {
    // Subscription normale con periodo definito
    nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
  } else if (trialEnd) {
    // Subscription in trial
    nextBillingDate = new Date(trialEnd * 1000).toISOString();
  } else if (created) {
    // Subscription senza periodo definito, usa created + 1 mese
    const nextMonth = new Date(created * 1000);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextBillingDate = nextMonth.toISOString();
  }
  
  console.log(`📅 Next billing date calculated: ${nextBillingDate}`);

  // Calcola l'ultimo pagamento (usa la data di creazione della subscription come fallback)
  let lastPaymentDate = null;
  if (created) {
    lastPaymentDate = new Date(created * 1000).toISOString();
  }
  
  console.log(`📅 Last payment date calculated: ${lastPaymentDate}`);

  await db.updateSubscriber(subscriberId, {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
    next_billing_date: nextBillingDate,
    last_payment_date: lastPaymentDate,
    is_active: subscription.status === 'active',
  });

  console.log(`Subscription created for subscriber: ${subscriberId}, status: ${subscription.status}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriberId = subscription.metadata?.subscriber_id;
  
  if (!subscriberId) {
    console.error("No subscriber_id in subscription metadata");
    return;
  }

  const subscriber = await db.getSubscriberById(subscriberId);
  if (!subscriber) {
    console.error(`Subscriber not found: ${subscriberId}`);
    return;
  }

  // Calcola la prossima data di fatturazione
  const nextBillingDate = (subscription as any).current_period_end 
    ? new Date((subscription as any).current_period_end * 1000).toISOString()
    : new Date().toISOString();

  let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED' = 'ACTIVE';
  
  switch (subscription.status) {
    case 'active':
      status = 'ACTIVE';
      break;
    case 'past_due':
      status = 'PAST_DUE';
      break;
    case 'canceled':
    case 'unpaid':
      status = 'CANCELED';
      break;
    case 'paused':
      status = 'PAUSED';
      break;
  }

  await db.updateSubscriber(subscriberId, {
    subscription_status: status,
    next_billing_date: nextBillingDate,
    is_active: subscription.status === 'active',
  });

  console.log(`Subscription updated for subscriber: ${subscriberId}, status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriberId = subscription.metadata?.subscriber_id;
  
  if (!subscriberId) {
    console.error("No subscriber_id in subscription metadata");
    return;
  }

  await db.updateSubscriber(subscriberId, {
    subscription_status: 'CANCELED',
    is_active: false,
  });

  console.log(`Subscription deleted for subscriber: ${subscriberId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!stripe) {
    console.error("Stripe non configurato");
    return;
  }
  
  if (!(invoice as any).subscription) return;

  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const subscriberId = subscription.metadata?.subscriber_id;
  
  if (!subscriberId) {
    console.error("No subscriber_id in subscription metadata");
    return;
  }

  const subscriber = await db.getSubscriberById(subscriberId);
  if (!subscriber) {
    console.error(`Subscriber not found: ${subscriberId}`);
    return;
  }

  // Aggiorna la data dell'ultimo pagamento
  const lastPaymentDate = new Date().toISOString();
  const nextBillingDate = (subscription as any).current_period_end 
    ? new Date((subscription as any).current_period_end * 1000).toISOString()
    : new Date().toISOString();

  await db.updateSubscriber(subscriberId, {
    last_payment_date: lastPaymentDate,
    next_billing_date: nextBillingDate,
    subscription_status: 'ACTIVE',
    is_active: true,
  });

  // Registra il pagamento nella tabella payments
  await db.createPayment({
    subscriber_id: subscriberId,
    stripe_payment_intent_id: (invoice as any).payment_intent as string,
    amount: (invoice as any).amount_paid / 100, // Converti da centesimi
    currency: invoice.currency,
    status: 'succeeded',
    paid_at: lastPaymentDate,
  });

  console.log(`Payment succeeded for subscriber: ${subscriberId}, amount: ${(invoice as any).amount_paid / 100} ${invoice.currency}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!stripe) {
    console.error("Stripe non configurato");
    return;
  }
  
  if (!(invoice as any).subscription) return;

  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const subscriberId = subscription.metadata?.subscriber_id;
  
  if (!subscriberId) {
    console.error("No subscriber_id in subscription metadata");
    return;
  }

  await db.updateSubscriber(subscriberId, {
    subscription_status: 'PAST_DUE',
    is_active: false,
  });

  // Registra il pagamento fallito nella tabella payments
  await db.createPayment({
    subscriber_id: subscriberId,
    stripe_payment_intent_id: (invoice as any).payment_intent as string,
    amount: (invoice as any).amount_due / 100, // Converti da centesimi
    currency: invoice.currency,
    status: 'failed',
    failure_reason: 'Payment failed',
  });

  console.log(`Payment failed for subscriber: ${subscriberId}`);
}
