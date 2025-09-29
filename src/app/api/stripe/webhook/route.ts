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
            
            // Recupera il tipo di abbonamento dal subscriber
            const subscriberData = await db.getSubscriberById(subscriberId);
            const subscriptionType = subscriberData?.subscription_type || 'monthly';
            
            let nextBillingDate = null;
            if (currentPeriodEnd) {
              // Subscription normale con periodo definito
              nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
            } else if (trialEnd) {
              // Subscription in trial
              nextBillingDate = new Date(trialEnd * 1000).toISOString();
            } else if (created) {
              // Subscription senza periodo definito, calcola in base al tipo
              const baseDate = new Date(created * 1000);
              if (subscriptionType === 'daily') {
                // Per abbonamenti giornalieri, aggiungi 1 giorno
                baseDate.setDate(baseDate.getDate() + 1);
              } else if (subscriptionType === 'yearly') {
                // Per abbonamenti annuali, aggiungi 1 anno
                baseDate.setFullYear(baseDate.getFullYear() + 1);
              } else {
                // Per abbonamenti mensili, aggiungi 1 mese
                baseDate.setMonth(baseDate.getMonth() + 1);
              }
              nextBillingDate = baseDate.toISOString();
            }
  
  console.log(`📅 Next billing date calculated: ${nextBillingDate}`);

  // Recupera l'ultimo pagamento da Stripe
  let lastPaymentDate = null;
  try {
    if (!stripe) {
      console.error('❌ Stripe not initialized');
      throw new Error('Stripe not initialized');
    }
    
    console.log(`🔍 Fetching invoices from Stripe for subscription: ${subscription.id}`);
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 5
    });
    
    console.log(`📋 Found ${invoices.data.length} invoices`);
    
    if (invoices.data.length > 0) {
      // Cerca la prima fattura pagata
      const paidInvoice = invoices.data.find(invoice => 
        invoice.status === 'paid' && (invoice as any).paid_at
      );
      
      if (paidInvoice) {
        lastPaymentDate = new Date((paidInvoice as any).paid_at * 1000).toISOString();
        console.log(`✅ Found paid invoice: ${paidInvoice.id}, paid_at: ${lastPaymentDate}`);
      } else {
        // Se non trova fatture pagate, usa la data di creazione della subscription
        if (created) {
          lastPaymentDate = new Date(created * 1000).toISOString();
          console.log(`📅 Using subscription creation date as last payment: ${lastPaymentDate}`);
        }
      }
    } else {
      // Se non ci sono fatture, usa la data di creazione della subscription
      if (created) {
        lastPaymentDate = new Date(created * 1000).toISOString();
        console.log(`📅 No invoices found, using subscription creation date: ${lastPaymentDate}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching invoices from Stripe:`, error);
    // Fallback alla data di creazione
    if (created) {
      lastPaymentDate = new Date(created * 1000).toISOString();
    }
  }
  
  console.log(`📅 Last payment date: ${lastPaymentDate}`);

  await db.updateSubscriber(subscriberId, {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
    next_billing_date: nextBillingDate || undefined,
    last_payment_date: lastPaymentDate || undefined,
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

  // Imposta automaticamente il progetto offline se l'abbonamento non è attivo
  if (status !== 'ACTIVE' && subscriber.edge_config_id && subscriber.vercel_token) {
    await setProjectOffline(subscriber);
  }

  console.log(`Subscription updated for subscriber: ${subscriberId}, status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
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

  await db.updateSubscriber(subscriberId, {
    subscription_status: 'CANCELED',
    is_active: false,
  });

  // Imposta automaticamente il progetto offline quando l'abbonamento viene cancellato
  if (subscriber.edge_config_id && subscriber.vercel_token) {
    await setProjectOffline(subscriber);
  }

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
  
  if (!(invoice as any).subscription) {
    console.log("⚠️ Invoice senza subscription, ignorando");
    return;
  }

  console.log("🔍 Processing payment failed for invoice:", invoice.id);
  console.log("🔍 Invoice subscription:", (invoice as any).subscription);

  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const subscriberId = subscription.metadata?.subscriber_id;
  
  console.log("🔍 Subscription metadata:", subscription.metadata);
  console.log("🔍 Found subscriber_id:", subscriberId);
  
  if (!subscriberId) {
    console.error("❌ No subscriber_id in subscription metadata");
    return;
  }

  const subscriber = await db.getSubscriberById(subscriberId);
  if (!subscriber) {
    console.error(`❌ Subscriber not found: ${subscriberId}`);
    return;
  }

  console.log("✅ Subscriber found:", subscriber.email);
  console.log("🔍 Subscriber edge_config_id:", subscriber.edge_config_id);
  console.log("🔍 Subscriber vercel_token:", subscriber.vercel_token ? "present" : "missing");

  await db.updateSubscriber(subscriberId, {
    subscription_status: 'PAST_DUE',
    is_active: false,
  });

  console.log("✅ Database updated: subscription_status = PAST_DUE");

  // Imposta automaticamente il progetto offline quando il pagamento fallisce
  if (subscriber.edge_config_id && subscriber.vercel_token) {
    console.log("🔴 Calling setProjectOffline...");
    await setProjectOffline(subscriber);
  } else {
    console.log("⚠️ Cannot set offline: missing edge_config_id or vercel_token");
  }

  // Registra il pagamento fallito nella tabella payments
  await db.createPayment({
    subscriber_id: subscriberId,
    stripe_payment_intent_id: (invoice as any).payment_intent as string,
    amount: (invoice as any).amount_due / 100, // Converti da centesimi
    currency: invoice.currency,
    status: 'failed',
    failure_reason: 'Payment failed',
  });

  console.log(`✅ Payment failed processed for subscriber: ${subscriberId}`);
}

// Funzione helper per impostare automaticamente il progetto offline
async function setProjectOffline(subscriber: any) {
  try {
    const { vercel_token, vercel_team_id, edge_config_id, edge_key } = subscriber;
    
    if (!vercel_token || !edge_config_id) {
      console.log('⚠️ Vercel token o Edge Config ID mancanti per impostare offline automaticamente');
      return;
    }

    console.log(`🔴 Impostando progetto offline automaticamente per: ${subscriber.first_name} ${subscriber.last_name}`);

    // Chiamata API Vercel Edge Config per impostare offline
    const base = `https://api.vercel.com/v1/edge-config/${edge_config_id}/items`;
    const qs = vercel_team_id ? `?teamId=${encodeURIComponent(vercel_team_id)}` : '';

    const res = await fetch(base + qs, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercel_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          { operation: 'upsert', key: edge_key || 'maintenance', value: true } // true = offline
        ]
      })
    });

    if (res.ok) {
      console.log(`✅ Progetto impostato offline automaticamente per: ${subscriber.first_name} ${subscriber.last_name}`);
    } else {
      console.error(`❌ Errore nell'impostare offline automaticamente:`, await res.text());
    }
  } catch (error) {
    console.error(`❌ Errore nella funzione setProjectOffline:`, error);
  }
}
