import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { stripe } from "@/lib/stripe";

// POST /api/sync-stripe-data - Sincronizza tutti i subscriber con i dati Stripe
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Sync Stripe data endpoint chiamato');
    
    if (!stripe) {
      return NextResponse.json({ error: "Stripe non configurato" }, { status: 500 });
    }

    // Recupera tutti i subscriber
    const subscribers = await db.getSubscribers();
    if (!subscribers) {
      return NextResponse.json({ error: "Errore nel recupero subscriber" }, { status: 500 });
    }

    console.log(`📋 Trovati ${subscribers.length} subscriber da sincronizzare`);

    const results = {
      total: subscribers.length,
      success: 0,
      errors: 0,
      details: [] as Array<{
        id: string;
        email: string;
        status: 'success' | 'error';
        message: string;
        stripeData?: any;
      }>
    };

    // Sincronizza ogni subscriber
    for (const subscriber of subscribers) {
      try {
        console.log(`🔄 Sincronizzando subscriber: ${subscriber.email} (${subscriber.id})`);
        
        let updatedData: any = {};
        let stripeData: any = {};

        // Se ha un Stripe Customer ID, recupera i dati del customer
        if (subscriber.stripe_customer_id) {
          try {
            const customer = await stripe.customers.retrieve(subscriber.stripe_customer_id);
            stripeData.customer = {
              id: customer.id,
              email: (customer as any).email,
              created: (customer as any).created
            };
            console.log(`✅ Customer Stripe recuperato: ${customer.id}`);
          } catch (error) {
            console.error(`❌ Errore recupero customer ${subscriber.stripe_customer_id}:`, error);
          }
        }

        // Se ha un Stripe Subscription ID, recupera i dati della subscription
        if (subscriber.stripe_subscription_id) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);
            stripeData.subscription = {
              id: subscription.id,
              status: subscription.status,
              current_period_start: (subscription as any).current_period_start,
              current_period_end: (subscription as any).current_period_end,
              created: (subscription as any).created,
              trial_start: (subscription as any).trial_start,
              trial_end: (subscription as any).trial_end
            };

            // Calcola la prossima fatturazione
            const currentPeriodEnd = (subscription as any).current_period_end;
            const trialEnd = (subscription as any).trial_end;
            const created = (subscription as any).created;
            const subscriptionType = subscriber.subscription_type || 'monthly';
            
            let nextBillingDate = null;
            if (currentPeriodEnd) {
              nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
            } else if (trialEnd) {
              nextBillingDate = new Date(trialEnd * 1000).toISOString();
            } else if (created) {
              const baseDate = new Date(created * 1000);
              if (subscriptionType === 'daily') {
                // Per abbonamenti giornalieri, aggiungi 1 giorno
                baseDate.setDate(baseDate.getDate() + 1);
              } else if (subscriptionType === 'yearly') {
                // Per abbonamenti annuali, aggiungi 1 anno
                baseDate.setFullYear(baseDate.getFullYear() + 1);
              } else {
                // Per abbonamenti mensili, aggiungi 1 mese
                baseDate.setMonth(baseDate.getMonth() + 1);
              }
              nextBillingDate = baseDate.toISOString();
            }

            updatedData.next_billing_date = nextBillingDate || undefined;
            updatedData.subscription_status = subscription.status === 'active' ? 'ACTIVE' : 'PENDING';
            updatedData.is_active = subscription.status === 'active';

            // Recupera l'ultimo pagamento
            try {
              const invoices = await stripe.invoices.list({
                subscription: subscription.id,
                limit: 5
              });
              
              if (invoices.data.length > 0) {
                const paidInvoice = invoices.data.find(invoice => 
                  invoice.status === 'paid' && (invoice as any).paid_at
                );
                
                if (paidInvoice) {
                  updatedData.last_payment_date = new Date((paidInvoice as any).paid_at * 1000).toISOString();
                  console.log(`✅ Ultimo pagamento trovato: ${updatedData.last_payment_date}`);
                } else if (created) {
                  updatedData.last_payment_date = new Date(created * 1000).toISOString();
                  console.log(`📅 Usando data creazione subscription: ${updatedData.last_payment_date}`);
                }
              } else if (created) {
                updatedData.last_payment_date = new Date(created * 1000).toISOString();
                console.log(`📅 Nessuna fattura, usando data creazione: ${updatedData.last_payment_date}`);
              }
            } catch (invoiceError) {
              console.error(`❌ Errore recupero fatture per subscription ${subscription.id}:`, invoiceError);
              if (created) {
                updatedData.last_payment_date = new Date(created * 1000).toISOString();
              }
            }

            console.log(`✅ Subscription Stripe recuperata: ${subscription.id}`);
          } catch (error) {
            console.error(`❌ Errore recupero subscription ${subscriber.stripe_subscription_id}:`, error);
            results.errors++;
            results.details.push({
              id: subscriber.id,
              email: subscriber.email,
              status: 'error',
              message: `Errore recupero subscription: ${error instanceof Error ? error.message : String(error)}`
            });
            continue;
          }
        }

        // Aggiorna il subscriber se ci sono dati da aggiornare
        if (Object.keys(updatedData).length > 0) {
          const updatedSubscriber = await db.updateSubscriber(subscriber.id, updatedData);
          if (updatedSubscriber) {
            results.success++;
            results.details.push({
              id: subscriber.id,
              email: subscriber.email,
              status: 'success',
              message: 'Sincronizzato con successo',
              stripeData: stripeData
            });
            console.log(`✅ Subscriber ${subscriber.email} sincronizzato con successo`);
          } else {
            results.errors++;
            results.details.push({
              id: subscriber.id,
              email: subscriber.email,
              status: 'error',
              message: 'Errore durante l\'aggiornamento nel database'
            });
            console.log(`❌ Errore aggiornamento subscriber ${subscriber.email}`);
          }
        } else {
          results.success++;
          results.details.push({
            id: subscriber.id,
            email: subscriber.email,
            status: 'success',
            message: 'Nessun aggiornamento necessario',
            stripeData: stripeData
          });
          console.log(`ℹ️ Subscriber ${subscriber.email} - nessun aggiornamento necessario`);
        }

      } catch (error) {
        results.errors++;
        results.details.push({
          id: subscriber.id,
          email: subscriber.email,
          status: 'error',
          message: `Errore generico: ${error instanceof Error ? error.message : String(error)}`
        });
        console.error(`❌ Errore sincronizzazione subscriber ${subscriber.email}:`, error);
      }
    }

    console.log(`🔄 Sincronizzazione completata: ${results.success} successi, ${results.errors} errori`);

    return NextResponse.json({
      success: true,
      message: `Sincronizzazione completata: ${results.success} successi, ${results.errors} errori`,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nella sincronizzazione Stripe:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
