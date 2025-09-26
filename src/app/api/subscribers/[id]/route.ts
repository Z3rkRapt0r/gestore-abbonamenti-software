import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";

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
      github_repo_template,
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
      github_repo_template,
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

// DELETE /api/subscribers/[id] - Elimina un subscriber
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await context.params;

    // Verifica che il subscriber esista
    const existingSubscriber = await db.getSubscriberById(id);
    if (!existingSubscriber) {
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }

    // Elimina il subscriber
    await db.deleteSubscriber(id);

    return NextResponse.json({
      success: true,
      message: "Subscriber eliminato con successo",
    });
  } catch (error: unknown) {
    console.error("Errore nell'eliminazione subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}
