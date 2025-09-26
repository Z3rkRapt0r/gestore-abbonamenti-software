import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// POST /api/debug-stripe-subscription - Debug per vedere i dati della subscription Stripe
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Stripe subscription endpoint chiamato');
    
    if (!stripe) {
      return NextResponse.json({ error: "Stripe non configurato" }, { status: 500 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "ID subscription richiesto" }, { status: 400 });
    }

    console.log('🔍 Cercando subscription:', subscriptionId);

    // Recupera la subscription da Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    console.log('✅ Subscription Stripe trovata:', {
      id: subscription.id,
      status: subscription.status,
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
      created: (subscription as any).created,
      trial_start: (subscription as any).trial_start,
      trial_end: (subscription as any).trial_end
    });

    // Recupera le fatture
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 5
    });

    console.log('📋 Fatture trovate:', invoices.data.length);

    const invoicesData = invoices.data.map(invoice => ({
      id: invoice.id,
      status: invoice.status,
      created: (invoice as any).created,
      paid_at: (invoice as any).paid_at,
      amount_paid: (invoice as any).amount_paid,
      amount_due: (invoice as any).amount_due,
      period_start: (invoice as any).period_start,
      period_end: (invoice as any).period_end
    }));

    // Calcola le date
    const currentPeriodStart = (subscription as any).current_period_start;
    const currentPeriodEnd = (subscription as any).current_period_end;
    
    const currentPeriodStartDate = currentPeriodStart 
      ? new Date(currentPeriodStart * 1000).toISOString()
      : null;
    const currentPeriodEndDate = currentPeriodEnd 
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null;

    // Per subscription mensili, la prossima fatturazione è current_period_end
    const nextBillingDate = currentPeriodEndDate;

    return NextResponse.json({
      success: true,
      message: "Dati subscription Stripe recuperati",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        current_period_start_date: currentPeriodStartDate,
        current_period_end_date: currentPeriodEndDate,
        next_billing_date: nextBillingDate,
        created: (subscription as any).created,
        trial_start: (subscription as any).trial_start,
        trial_end: (subscription as any).trial_end
      },
      invoices: invoicesData,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug Stripe subscription:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
