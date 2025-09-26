import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { stripe } from "@/lib/stripe";

// POST /api/debug-manual-stripe-update - Aggiorna manualmente un subscriber da Stripe
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug manual Stripe update endpoint chiamato');
    
    if (!stripe) {
      return NextResponse.json({ error: "Stripe non configurato" }, { status: 500 });
    }

    const body = await request.json();
    const { subscriberId } = body;

    if (!subscriberId) {
      return NextResponse.json({ error: "ID subscriber richiesto" }, { status: 400 });
    }

    console.log('🔍 Cercando subscriber:', subscriberId);

    // Recupera il subscriber
    const subscriber = await db.getSubscriberById(subscriberId);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }

    console.log('✅ Subscriber trovato:', {
      id: subscriber.id,
      email: subscriber.email,
      stripe_customer_id: subscriber.stripe_customer_id,
      stripe_subscription_id: subscriber.stripe_subscription_id
    });

    if (!subscriber.stripe_customer_id) {
      return NextResponse.json({ 
        error: "Nessun Stripe Customer ID trovato per questo subscriber" 
      }, { status: 400 });
    }

    // Recupera i dati da Stripe
    console.log('🔍 Recuperando dati da Stripe...');
    
    const customer = await stripe.customers.retrieve(subscriber.stripe_customer_id);
    console.log('✅ Customer Stripe:', {
      id: customer.id,
      email: (customer as any).email,
      created: (customer as any).created
    });

    // Recupera le subscription del customer
    const subscriptions = await stripe.subscriptions.list({
      customer: subscriber.stripe_customer_id,
      status: 'all'
    });

    console.log('📋 Subscription trovate:', subscriptions.data.length);
    
    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: "Nessuna subscription trovata per questo customer" 
      }, { status: 400 });
    }

    // Prendi la subscription più recente
    const latestSubscription = subscriptions.data[0];
    console.log('✅ Subscription più recente:', {
      id: latestSubscription.id,
      status: latestSubscription.status,
      current_period_end: (latestSubscription as any).current_period_end
    });

    // Aggiorna il subscriber con i dati da Stripe
    const nextBillingDate = (latestSubscription as any).current_period_end 
      ? new Date((latestSubscription as any).current_period_end * 1000).toISOString()
      : new Date().toISOString();

    const updatedSubscriber = await db.updateSubscriber(subscriberId, {
      stripe_subscription_id: latestSubscription.id,
      subscription_status: latestSubscription.status === 'active' ? 'ACTIVE' : 'PENDING',
      is_active: latestSubscription.status === 'active',
      next_billing_date: nextBillingDate,
      last_payment_date: new Date().toISOString()
    });

    if (!updatedSubscriber) {
      return NextResponse.json({ 
        error: "Errore durante l'aggiornamento del subscriber" 
      }, { status: 500 });
    }

    console.log('✅ Subscriber aggiornato:', {
      id: updatedSubscriber.id,
      subscription_status: updatedSubscriber.subscription_status,
      is_active: updatedSubscriber.is_active,
      stripe_subscription_id: updatedSubscriber.stripe_subscription_id
    });

    return NextResponse.json({
      success: true,
      message: "Subscriber aggiornato manualmente da Stripe",
      subscriber: {
        id: updatedSubscriber.id,
        email: updatedSubscriber.email,
        subscription_status: updatedSubscriber.subscription_status,
        is_active: updatedSubscriber.is_active,
        stripe_customer_id: updatedSubscriber.stripe_customer_id,
        stripe_subscription_id: updatedSubscriber.stripe_subscription_id,
        next_billing_date: updatedSubscriber.next_billing_date,
        last_payment_date: updatedSubscriber.last_payment_date
      },
      stripeData: {
        customer: {
          id: customer.id,
          email: (customer as any).email
        },
        subscription: {
          id: latestSubscription.id,
          status: latestSubscription.status,
          current_period_end: (latestSubscription as any).current_period_end
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug manual Stripe update:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
