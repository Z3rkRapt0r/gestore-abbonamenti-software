import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/create-checkout - Crea checkout session per nuovo abbonato
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checkout endpoint chiamato');
    
    // await requireAuth(); // Temporaneamente disabilitato per debug

    if (!stripe) {
      console.log('❌ Stripe non configurato');
      return NextResponse.json({ error: "Stripe non configurato" }, { status: 500 });
    }

    console.log('✅ Stripe configurato');

    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const { subscriberId, successUrl, cancelUrl } = body;

    if (!subscriberId) {
      console.log('❌ ID abbonato mancante');
      return NextResponse.json({ error: "ID abbonato richiesto" }, { status: 400 });
    }

    console.log('🔍 Cercando subscriber:', subscriberId);

    // Recupera i dati del subscriber
    const subscriber = await db.getSubscriberById(subscriberId);
    if (!subscriber) {
      console.log('❌ Subscriber non trovato:', subscriberId);
      return NextResponse.json({ error: "Abbonato non trovato" }, { status: 404 });
    }

    console.log('✅ Subscriber trovato:', {
      id: subscriber.id,
      email: subscriber.email,
      price: subscriber.subscription_price
    });

    if (!subscriber.subscription_price) {
      console.log('❌ Prezzo abbonamento non configurato');
      return NextResponse.json({ error: "Prezzo abbonamento non configurato" }, { status: 400 });
    }

    // Crea o recupera customer Stripe
    let customerId = subscriber.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: subscriber.email,
        name: `${subscriber.first_name} ${subscriber.last_name}`,
        metadata: {
          subscriber_id: subscriber.id,
          project_name: subscriber.project_name,
        },
      });
      customerId = customer.id;

      // Aggiorna il subscriber con il customer ID
      await db.updateSubscriber(subscriber.id, {
        stripe_customer_id: customerId,
      });
    }

    // Determina intervallo in base al tipo di abbonamento selezionato
    const subscriptionType = (subscriber as any).subscription_type || 'monthly';
    const interval: 'day' | 'month' | 'year' =
      subscriptionType === 'daily' ? 'day' : subscriptionType === 'yearly' ? 'year' : 'month';
    const prettyInterval = interval === 'day' ? 'giornaliero' : interval === 'year' ? 'annuale' : 'mensile';

    // Crea checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Abbonamento ${subscriber.project_name}`,
              description: `Abbonamento ${prettyInterval} per il progetto ${subscriber.project_name}`,
            },
            unit_amount: Math.round(subscriber.subscription_price * 100), // Converti in centesimi
            recurring: {
              interval,
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        subscriber_id: subscriber.id,
      },
      subscription_data: {
        metadata: {
          subscriber_id: subscriber.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });

  } catch (error: unknown) {
    console.error("❌ Errore nella creazione checkout session:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
