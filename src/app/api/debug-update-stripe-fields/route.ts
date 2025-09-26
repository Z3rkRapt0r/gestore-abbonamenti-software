import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { stripe } from "@/lib/stripe";

// POST /api/debug-update-stripe-fields - Aggiorna i campi di pagamento da Stripe
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug update Stripe fields endpoint chiamato');
    
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

    if (!subscriber.stripe_subscription_id) {
      return NextResponse.json({ 
        error: "Nessun Stripe Subscription ID trovato per questo subscriber" 
      }, { status: 400 });
    }

    // Recupera i dati della subscription da Stripe
    console.log('🔍 Recuperando subscription da Stripe...');
    const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);
    
    console.log('✅ Subscription Stripe:', {
      id: subscription.id,
      status: subscription.status,
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
      created: (subscription as any).created
    });

    // Recupera l'ultimo pagamento
    console.log('🔍 Recuperando ultimo pagamento...');
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 5
    });

    let lastPaymentDate = null;
    if (invoices.data.length > 0) {
      // Cerca la prima fattura pagata
      const paidInvoice = invoices.data.find(invoice => 
        invoice.status === 'paid' && (invoice as any).paid_at
      );
      
      if (paidInvoice) {
        console.log('✅ Ultima fattura pagata:', {
          id: paidInvoice.id,
          status: paidInvoice.status,
          paid_at: (paidInvoice as any).paid_at,
          amount_paid: (paidInvoice as any).amount_paid
        });
        
        lastPaymentDate = new Date((paidInvoice as any).paid_at * 1000).toISOString();
      } else {
        // Se non trova fatture pagate, usa la data di creazione della subscription
        console.log('🔍 Nessuna fattura pagata trovata, uso data creazione subscription');
        const created = (subscription as any).created;
        if (created) {
          lastPaymentDate = new Date(created * 1000).toISOString();
        }
      }
    } else {
      // Se non ci sono fatture, usa la data di creazione della subscription
      console.log('🔍 Nessuna fattura trovata, uso data creazione subscription');
      const created = (subscription as any).created;
      if (created) {
        lastPaymentDate = new Date(created * 1000).toISOString();
      }
    }

    // Calcola le date
    const currentPeriodEnd = (subscription as any).current_period_end;
    const trialEnd = (subscription as any).trial_end;
    const created = (subscription as any).created;
    
    let nextBillingDate = null;
    if (currentPeriodEnd) {
      // Subscription normale con periodo definito
      nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
    } else if (trialEnd) {
      // Subscription in trial
      nextBillingDate = new Date(trialEnd * 1000).toISOString();
    } else if (created) {
      // Subscription senza periodo definito, usa created + 1 mese
      const nextMonth = new Date(created * 1000);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextBillingDate = nextMonth.toISOString();
    }

    console.log('📅 Date calcolate:', {
      nextBillingDate,
      lastPaymentDate
    });

    // Aggiorna il subscriber
    const updatedSubscriber = await db.updateSubscriber(subscriberId, {
      subscription_status: subscription.status === 'active' ? 'ACTIVE' : 'PENDING',
      is_active: subscription.status === 'active',
      next_billing_date: nextBillingDate || undefined,
      last_payment_date: lastPaymentDate || undefined
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
      next_billing_date: updatedSubscriber.next_billing_date,
      last_payment_date: updatedSubscriber.last_payment_date
    });

    return NextResponse.json({
      success: true,
      message: "Campi di pagamento aggiornati da Stripe",
      subscriber: {
        id: updatedSubscriber.id,
        email: updatedSubscriber.email,
        subscription_status: updatedSubscriber.subscription_status,
        is_active: updatedSubscriber.is_active,
        stripe_customer_id: updatedSubscriber.stripe_customer_id,
        stripe_subscription_id: updatedSubscriber.stripe_subscription_id,
        next_billing_date: updatedSubscriber.next_billing_date,
        last_payment_date: updatedSubscriber.last_payment_date,
        subscription_price: updatedSubscriber.subscription_price
      },
      stripeData: {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end
        },
        lastInvoice: invoices.data.length > 0 ? {
          id: invoices.data[0].id,
          status: invoices.data[0].status,
          paid_at: (invoices.data[0] as any).paid_at,
          amount_paid: (invoices.data[0] as any).amount_paid
        } : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug update Stripe fields:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
