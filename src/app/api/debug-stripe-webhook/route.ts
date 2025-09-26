import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/debug-stripe-webhook - Debug per verificare stato webhook Stripe
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Stripe webhook endpoint chiamato');
    
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
      subscription_status: subscriber.subscription_status,
      is_active: subscriber.is_active,
      stripe_customer_id: subscriber.stripe_customer_id,
      stripe_subscription_id: subscriber.stripe_subscription_id,
      next_billing_date: subscriber.next_billing_date,
      last_payment_date: subscriber.last_payment_date
    });

    // Verifica configurazione Stripe
    const stripeConfig = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    };

    console.log('🔧 Configurazione Stripe:', stripeConfig);

    return NextResponse.json({
      success: true,
      message: "Debug webhook Stripe completato",
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        subscription_status: subscriber.subscription_status,
        is_active: subscriber.is_active,
        stripe_customer_id: subscriber.stripe_customer_id,
        stripe_subscription_id: subscriber.stripe_subscription_id,
        next_billing_date: subscriber.next_billing_date,
        last_payment_date: subscriber.last_payment_date,
        subscription_price: subscriber.subscription_price
      },
      stripeConfig: stripeConfig,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug webhook Stripe:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
