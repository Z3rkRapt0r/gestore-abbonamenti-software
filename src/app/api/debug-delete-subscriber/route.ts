import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { deleteCustomerFromStripe } from "@/lib/stripe-helpers";

// Debug endpoint per testare la cancellazione completa di un subscriber
export async function POST(request: NextRequest) {
  try {
    const { subscriberId } = await request.json();

    if (!subscriberId) {
      return NextResponse.json({ 
        error: "subscriberId è richiesto" 
      }, { status: 400 });
    }

    console.log(`🧪 DEBUG: Test cancellazione subscriber ${subscriberId}`);

    // 1. Recupera il subscriber
    const subscriber = await db.getSubscriberById(subscriberId);
    if (!subscriber) {
      return NextResponse.json({ 
        error: "Subscriber non trovato" 
      }, { status: 404 });
    }

    console.log('📋 Subscriber trovato:', {
      id: subscriber.id,
      email: subscriber.email,
      stripe_customer_id: subscriber.stripe_customer_id,
      stripe_subscription_id: subscriber.stripe_subscription_id,
      subscription_status: subscriber.subscription_status
    });

    // 2. Test cancellazione Stripe (SOLO SIMULAZIONE)
    console.log('🔄 Simulando cancellazione Stripe...');
    
    let stripeResult = null;
    if (subscriber.stripe_customer_id || subscriber.stripe_subscription_id) {
      console.log('⚠️ ATTENZIONE: Questo è un test - NON verranno cancellati dati reali da Stripe');
      console.log(`   - Customer ID: ${subscriber.stripe_customer_id || 'N/A'}`);
      console.log(`   - Subscription ID: ${subscriber.stripe_subscription_id || 'N/A'}`);
      
      // Per il test, mostriamo cosa succederebbe senza eseguire realmente
      stripeResult = {
        success: true,
        subscriptionCanceled: !!subscriber.stripe_subscription_id,
        customerDeleted: !!subscriber.stripe_customer_id,
        errors: []
      };
    } else {
      console.log('ℹ️ Nessun dato Stripe da cancellare');
      stripeResult = {
        success: true,
        subscriptionCanceled: false,
        customerDeleted: false,
        errors: []
      };
    }

    // 3. Test eliminazione database (SOLO SIMULAZIONE)
    console.log('🔄 Simulando eliminazione dal database...');
    console.log('⚠️ ATTENZIONE: Questo è un test - NON verrà eliminato dal database');

    return NextResponse.json({
      success: true,
      message: "Test di cancellazione completato (SIMULAZIONE)",
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        stripe_customer_id: subscriber.stripe_customer_id,
        stripe_subscription_id: subscriber.stripe_subscription_id,
        subscription_status: subscriber.subscription_status
      },
      simulation: {
        stripe: stripeResult,
        database: "Simulato - subscriber NON eliminato"
      },
      note: "Per eseguire la cancellazione reale, usa il pulsante 'Elimina Cliente' nella dashboard"
    });

  } catch (error: unknown) {
    console.error("Errore nel test di cancellazione:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
