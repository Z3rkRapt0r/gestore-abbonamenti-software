import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/database";
import { headers } from "next/headers";
import Stripe from "stripe";

// POST /api/stripe/webhook - Gestisce eventi webhook da Stripe
export async function POST(request: NextRequest) {
  try {
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
  const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();

  await db.updateSubscriber(subscriberId, {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
    next_billing_date: nextBillingDate,
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
  const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();

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
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
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
  const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();

  await db.updateSubscriber(subscriberId, {
    last_payment_date: lastPaymentDate,
    next_billing_date: nextBillingDate,
    subscription_status: 'ACTIVE',
    is_active: true,
  });

  // Registra il pagamento nella tabella payments
  await db.createPayment({
    subscriber_id: subscriberId,
    stripe_payment_intent_id: invoice.payment_intent as string,
    amount: invoice.amount_paid / 100, // Converti da centesimi
    currency: invoice.currency,
    status: 'succeeded',
    paid_at: lastPaymentDate,
  });

  console.log(`Payment succeeded for subscriber: ${subscriberId}, amount: ${invoice.amount_paid / 100} ${invoice.currency}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
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
    stripe_payment_intent_id: invoice.payment_intent as string,
    amount: invoice.amount_due / 100, // Converti da centesimi
    currency: invoice.currency,
    status: 'failed',
    failure_reason: 'Payment failed',
  });

  console.log(`Payment failed for subscriber: ${subscriberId}`);
}
