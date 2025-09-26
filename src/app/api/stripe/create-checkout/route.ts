import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/create-checkout - Crea checkout session per nuovo abbonato
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    if (!stripe) {
      return NextResponse.json({ error: "Stripe non configurato" }, { status: 500 });
    }

    const body = await request.json();
    const { subscriberId, successUrl, cancelUrl } = body;

    if (!subscriberId) {
      return NextResponse.json({ error: "ID abbonato richiesto" }, { status: 400 });
    }

    // Recupera i dati del subscriber
    const subscriber = await db.getSubscriberById(subscriberId);
    if (!subscriber) {
      return NextResponse.json({ error: "Abbonato non trovato" }, { status: 404 });
    }

    if (!subscriber.subscription_price) {
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
              description: `Abbonamento mensile per il progetto ${subscriber.project_name}`,
            },
            unit_amount: Math.round(subscriber.subscription_price * 100), // Converti in centesimi
            recurring: {
              interval: 'month',
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
    console.error("Errore nella creazione checkout session:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}
