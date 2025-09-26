import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// GET /api/debug-subscriber-list - Lista tutti i subscriber per debug
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug subscriber list endpoint chiamato');

    // Recupera tutti i subscriber
    const subscribers = await db.getSubscribers();
    
    if (!subscribers) {
      return NextResponse.json({ error: "Errore nel recupero subscriber" }, { status: 500 });
    }

    console.log('✅ Subscriber trovati:', subscribers.length);

    // Filtra solo i campi necessari per il debug
    const debugSubscribers = subscribers.map(sub => ({
      id: sub.id,
      email: sub.email,
      first_name: sub.first_name,
      last_name: sub.last_name,
      project_name: sub.project_name,
      subscription_status: sub.subscription_status,
      is_active: sub.is_active,
      stripe_customer_id: sub.stripe_customer_id,
      stripe_subscription_id: sub.stripe_subscription_id,
      subscription_price: sub.subscription_price,
      next_billing_date: sub.next_billing_date,
      last_payment_date: sub.last_payment_date,
      created_at: sub.created_at
    }));

    return NextResponse.json({
      success: true,
      message: "Lista subscriber per debug",
      count: subscribers.length,
      subscribers: debugSubscribers,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug subscriber list:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
