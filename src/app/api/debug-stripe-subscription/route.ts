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
      trial_end: (subscription as any).trial_end,
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
      canceled_at: (subscription as any).canceled_at,
      items: (subscription as any).items?.data?.map((item: any) => ({
        id: item.id,
        price: item.price?.id,
        interval: item.price?.recurring?.interval,
        interval_count: item.price?.recurring?.interval_count
      }))
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
    const trialStart = (subscription as any).trial_start;
    const trialEnd = (subscription as any).trial_end;
    const created = (subscription as any).created;
    
    const currentPeriodStartDate = currentPeriodStart 
      ? new Date(currentPeriodStart * 1000).toISOString()
      : null;
    const currentPeriodEndDate = currentPeriodEnd 
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null;
    const trialStartDate = trialStart 
      ? new Date(trialStart * 1000).toISOString()
      : null;
    const trialEndDate = trialEnd 
      ? new Date(trialEnd * 1000).toISOString()
      : null;
    const createdDate = created 
      ? new Date(created * 1000).toISOString()
      : null;

    // Determina la prossima fatturazione
    let nextBillingDate = null;
    if (currentPeriodEnd) {
      // Subscription normale con periodo definito
      nextBillingDate = currentPeriodEndDate;
    } else if (trialEnd) {
      // Subscription in trial
      nextBillingDate = trialEndDate;
    } else if (created) {
      // Subscription senza periodo definito, usa created + 1 mese
      const nextMonth = new Date(created * 1000);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextBillingDate = nextMonth.toISOString();
    }

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
        trial_start: trialStart,
        trial_end: trialEnd,
        trial_start_date: trialStartDate,
        trial_end_date: trialEndDate,
        created: created,
        created_date: createdDate,
        next_billing_date: nextBillingDate,
        cancel_at_period_end: (subscription as any).cancel_at_period_end,
        canceled_at: (subscription as any).canceled_at,
        items: (subscription as any).items?.data?.map((item: any) => ({
          id: item.id,
          price: item.price?.id,
          interval: item.price?.recurring?.interval,
          interval_count: item.price?.recurring?.interval_count
        }))
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
