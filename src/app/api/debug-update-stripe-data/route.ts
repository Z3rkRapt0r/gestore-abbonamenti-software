import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/debug-update-stripe-data - Debug endpoint per aggiornare manualmente i dati Stripe
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug update Stripe data endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const { subscriberId, stripeCustomerId, stripeSubscriptionId, subscriptionPrice } = body;
    
    if (!subscriberId) {
      return NextResponse.json({ error: "ID subscriber richiesto" }, { status: 400 });
    }
    
    console.log('🔍 Cercando subscriber:', subscriberId);
    
    // Verifica che il subscriber esista
    const existingSubscriber = await db.getSubscriberById(subscriberId);
    if (!existingSubscriber) {
      console.log('❌ Subscriber non trovato:', subscriberId);
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }
    
    console.log('✅ Subscriber trovato:', {
      id: existingSubscriber.id,
      email: existingSubscriber.email,
      current_status: existingSubscriber.subscription_status
    });
    
    // Aggiorna i dati Stripe
    console.log('💾 Aggiornando dati Stripe...');
    const updates: any = {
      subscription_status: 'ACTIVE',
      is_active: true,
      last_payment_date: new Date().toISOString(),
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 giorni da ora
    };
    
    if (stripeCustomerId) {
      updates.stripe_customer_id = stripeCustomerId;
    }
    
    if (stripeSubscriptionId) {
      updates.stripe_subscription_id = stripeSubscriptionId;
    }
    
    if (subscriptionPrice) {
      updates.subscription_price = subscriptionPrice;
    }
    
    console.log('📝 Aggiornamenti da applicare:', updates);
    
    const updatedSubscriber = await db.updateSubscriber(subscriberId, updates);
    
    if (!updatedSubscriber) {
      console.log('❌ Errore durante aggiornamento subscriber');
      return NextResponse.json({ 
        error: "Errore durante l'aggiornamento",
        details: "updateSubscriber returned null"
      }, { status: 500 });
    }
    
    console.log('✅ Subscriber aggiornato con successo:', {
      id: updatedSubscriber.id,
      email: updatedSubscriber.email,
      status: updatedSubscriber.subscription_status,
      is_active: updatedSubscriber.is_active,
      stripe_customer_id: updatedSubscriber.stripe_customer_id,
      stripe_subscription_id: updatedSubscriber.stripe_subscription_id
    });
    
    return NextResponse.json({
      success: true,
      message: "Dati Stripe aggiornati con successo",
      original: {
        status: existingSubscriber.subscription_status,
        is_active: existingSubscriber.is_active,
        stripe_customer_id: existingSubscriber.stripe_customer_id,
        stripe_subscription_id: existingSubscriber.stripe_subscription_id
      },
      updated: {
        status: updatedSubscriber.subscription_status,
        is_active: updatedSubscriber.is_active,
        stripe_customer_id: updatedSubscriber.stripe_customer_id,
        stripe_subscription_id: updatedSubscriber.stripe_subscription_id,
        subscription_price: updatedSubscriber.subscription_price,
        last_payment_date: updatedSubscriber.last_payment_date,
        next_billing_date: updatedSubscriber.next_billing_date
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    console.error("❌ Errore nel debug update Stripe data:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
