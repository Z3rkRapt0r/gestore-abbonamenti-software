import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { stripe } from "@/lib/stripe";

// POST /api/debug-checkout - Debug della creazione checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId } = body;

    if (!subscriberId) {
      return NextResponse.json({ error: "ID abbonato richiesto" }, { status: 400 });
    }

    console.log('🔍 Debug checkout per subscriber:', subscriberId);

    // Verifica configurazione Stripe
    const stripeConfig = {
      isConfigured: !!stripe,
      secretKey: process.env.STRIPE_SECRET_KEY ? '***configurato***' : 'NON CONFIGURATO',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ? '***configurato***' : 'NON CONFIGURATO',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? '***configurato***' : 'NON CONFIGURATO',
    };

    // Recupera i dati del subscriber
    const subscriber = await db.getSubscriberById(subscriberId);
    if (!subscriber) {
      return NextResponse.json({ error: "Abbonato non trovato" }, { status: 404 });
    }

    console.log('📋 Dati subscriber:', {
      id: subscriber.id,
      email: subscriber.email,
      subscription_price: subscriber.subscription_price,
      stripe_customer_id: subscriber.stripe_customer_id,
      subscription_status: subscriber.subscription_status,
    });

    // Verifica prezzo
    if (!subscriber.subscription_price) {
      return NextResponse.json({ 
        error: "Prezzo abbonamento non configurato",
        debug: {
          stripeConfig,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            subscription_price: subscriber.subscription_price,
            subscription_status: subscriber.subscription_status,
          }
        }
      }, { status: 400 });
    }

    // Test creazione customer (senza salvare)
    if (!stripe) {
      return NextResponse.json({ 
        error: "Stripe non configurato",
        debug: { stripeConfig }
      }, { status: 500 });
    }

    // Test creazione checkout session (senza salvare)
    try {
      const testSession = await stripe.checkout.sessions.create({
        customer_email: subscriber.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Test - Abbonamento ${subscriber.project_name}`,
                description: `Test abbonamento mensile per il progetto ${subscriber.project_name}`,
              },
              unit_amount: Math.round(subscriber.subscription_price * 100),
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?test=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?test=cancel`,
        metadata: {
          subscriber_id: subscriber.id,
          test: 'true',
        },
      });

      // Cancella la sessione di test
      await stripe.checkout.sessions.expire(testSession.id);

      return NextResponse.json({
        success: true,
        message: "Test checkout session riuscito",
        debug: {
          stripeConfig,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            subscription_price: subscriber.subscription_price,
            subscription_status: subscriber.subscription_status,
          },
          testSessionId: testSession.id,
        }
      });

    } catch (stripeError: any) {
      console.error('❌ Errore Stripe:', stripeError);
      return NextResponse.json({ 
        error: "Errore nella creazione checkout session",
        details: stripeError.message,
        debug: {
          stripeConfig,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            subscription_price: subscriber.subscription_price,
            subscription_status: subscriber.subscription_status,
          }
        }
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Errore nel debug checkout:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
