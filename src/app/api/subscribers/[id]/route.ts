import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";
import { deleteCustomerFromStripe } from "@/lib/stripe-helpers";

// GET /api/subscribers/[id] - Recupera un subscriber specifico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const subscriber = await db.getSubscriberById(id);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscriber,
    });
  } catch (error: unknown) {
    console.error("Errore nel recupero subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}

// PUT /api/subscribers/[id] - Aggiorna un subscriber
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // await requireAuth(); // Temporaneamente disabilitato per debug
    const { id } = await context.params;
    
    console.log('🔍 PUT /api/subscribers/[id] chiamato con ID:', id);

    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const {
      first_name,
      last_name,
      email,
      project_name,
      subscription_price,
      notes,
      edge_config_id,
      edge_key,
      vercel_token,
      vercel_team_id,
      supabase_info,
    } = body;

    // Validazione campi obbligatori
    if (!first_name || !last_name || !email || !project_name) {
      return NextResponse.json({ 
        error: "Nome, cognome, email e progetto sono obbligatori" 
      }, { status: 400 });
    }

    // Verifica che il subscriber esista
    console.log('🔍 Cercando subscriber esistente...');
    const existingSubscriber = await db.getSubscriberById(id);
    if (!existingSubscriber) {
      console.log('❌ Subscriber non trovato:', id);
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }
    console.log('✅ Subscriber trovato:', existingSubscriber.email);

    // Aggiorna il subscriber
    console.log('💾 Aggiornando subscriber...');
    const updatedSubscriber = await db.updateSubscriber(id, {
      first_name,
      last_name,
      email,
      project_name,
      subscription_price: subscription_price || 0,
      notes,
      edge_config_id,
      edge_key: edge_key || 'maintenance',
      vercel_token,
      vercel_team_id,
      supabase_info,
    });

    if (!updatedSubscriber) {
      console.log('❌ Errore durante aggiornamento subscriber');
      return NextResponse.json({ 
        error: "Errore durante l'aggiornamento" 
      }, { status: 500 });
    }

    console.log('✅ Subscriber aggiornato con successo:', updatedSubscriber.email);
    return NextResponse.json({
      success: true,
      message: "Subscriber aggiornato con successo",
      subscriber: updatedSubscriber,
    });
  } catch (error: unknown) {
    console.error("Errore nell'aggiornamento subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE /api/subscribers/[id] - Elimina un subscriber (cancellazione completa da Stripe + Database)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // await requireAuth(); // Temporaneamente disabilitato per debug
    const { id } = await context.params;
    
    console.log('🗑️ DELETE /api/subscribers/[id] chiamato con ID:', id);

    // Verifica che il subscriber esista
    console.log('🔍 Cercando subscriber da eliminare...');
    const existingSubscriber = await db.getSubscriberById(id);
    if (!existingSubscriber) {
      console.log('❌ Subscriber non trovato:', id);
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }
    console.log('✅ Subscriber trovato:', existingSubscriber.email);

    // 1. CANCELLAZIONE DA STRIPE (se esistono dati Stripe)
    let stripeDeletionResult = null;
    if (existingSubscriber.stripe_customer_id || existingSubscriber.stripe_subscription_id) {
      console.log('🔄 Iniziando cancellazione da Stripe...');
      console.log(`   - Customer ID: ${existingSubscriber.stripe_customer_id || 'N/A'}`);
      console.log(`   - Subscription ID: ${existingSubscriber.stripe_subscription_id || 'N/A'}`);
      
      stripeDeletionResult = await deleteCustomerFromStripe(
        existingSubscriber.stripe_customer_id,
        existingSubscriber.stripe_subscription_id
      );
      
      if (stripeDeletionResult.success) {
        console.log('✅ Cancellazione Stripe completata con successo');
        if (stripeDeletionResult.subscriptionCanceled) {
          console.log('   - Subscription cancellata');
        }
        if (stripeDeletionResult.customerDeleted) {
          console.log('   - Customer eliminato');
        }
      } else {
        console.log('⚠️ Cancellazione Stripe completata con errori:', stripeDeletionResult.errors);
        // Continuiamo comunque con l'eliminazione dal database
      }
    } else {
      console.log('ℹ️ Nessun dato Stripe da cancellare');
    }

    // 2. ELIMINAZIONE DAL DATABASE
    console.log('🗑️ Eliminando subscriber dal database...');
    const deleteResult = await db.deleteSubscriber(id);
    
    if (!deleteResult) {
      console.log('❌ Errore durante eliminazione subscriber dal database');
      return NextResponse.json({ 
        error: "Errore durante l'eliminazione dal database" 
      }, { status: 500 });
    }
    
    console.log('✅ Subscriber eliminato dal database con successo:', existingSubscriber.email);

    // 3. RISPOSTA CON DETTAGLI
    const response: any = {
      success: true,
      message: "Subscriber eliminato con successo",
      details: {
        database: "Eliminato",
        stripe: stripeDeletionResult ? {
          success: stripeDeletionResult.success,
          subscriptionCanceled: stripeDeletionResult.subscriptionCanceled || false,
          customerDeleted: stripeDeletionResult.customerDeleted || false,
          errors: stripeDeletionResult.errors || []
        } : "Nessun dato Stripe da cancellare"
      }
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Errore nell'eliminazione subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
