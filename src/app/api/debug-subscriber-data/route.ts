import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/debug-subscriber-data - Debug endpoint per verificare i dati del subscriber
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug subscriber data endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const { subscriberId } = body;
    
    if (!subscriberId) {
      return NextResponse.json({ error: "ID subscriber richiesto" }, { status: 400 });
    }
    
    console.log('🔍 Cercando subscriber:', subscriberId);
    
    // Recupera il subscriber dal database
    const subscriber = await db.getSubscriberById(subscriberId);
    if (!subscriber) {
      console.log('❌ Subscriber non trovato:', subscriberId);
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }
    
    console.log('✅ Subscriber trovato:', {
      id: subscriber.id,
      email: subscriber.email,
      subscription_status: subscriber.subscription_status,
      is_active: subscriber.is_active,
      created_at: subscriber.created_at
    });
    
    return NextResponse.json({
      success: true,
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        first_name: subscriber.first_name,
        last_name: subscriber.last_name,
        project_name: subscriber.project_name,
        subscription_status: subscriber.subscription_status,
        is_active: subscriber.is_active,
        subscription_price: subscriber.subscription_price,
        stripe_customer_id: subscriber.stripe_customer_id,
        stripe_subscription_id: subscriber.stripe_subscription_id,
        next_billing_date: subscriber.next_billing_date,
        last_payment_date: subscriber.last_payment_date,
        created_at: subscriber.created_at,
        updated_at: subscriber.updated_at
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    console.error("❌ Errore nel debug subscriber data:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
