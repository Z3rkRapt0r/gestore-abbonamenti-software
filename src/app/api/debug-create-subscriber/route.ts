import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/debug-create-subscriber - Debug endpoint per testare creazione subscriber
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug create subscriber endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const {
      firstName,
      lastName,
      email,
      projectName,
      subscriptionPrice
    } = body;
    
    if (!firstName || !lastName || !email || !projectName) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }
    
    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    
    console.log('💾 Creando subscriber con dati:', {
      first_name: firstName,
      last_name: lastName,
      email,
      project_name: projectName,
      client_slug: clientSlug,
      subscription_price: subscriptionPrice || 0,
      subscription_status: 'PENDING',
      is_active: false
    });
    
    // Crea il subscriber con stato PENDING
    const newSubscriber = await db.createSubscriber({
      first_name: firstName,
      last_name: lastName,
      email,
      project_name: projectName,
      github_repo_template: 'test/template',
      client_slug: clientSlug,
      vercel_token: 'test-token',
      vercel_team_id: 'test-team',
      subscription_price: subscriptionPrice || 0,
      supabase_info: 'test info',
      custom_config: {},
      edge_config_id: 'test-config',
      edge_key: 'maintenance',
      notes: 'Test subscriber',
      subscription_status: 'PENDING', // Forza PENDING
      is_active: false, // Forza false
    });
    
    if (!newSubscriber) {
      console.log('❌ Errore durante creazione subscriber');
      return NextResponse.json({ 
        error: "Errore durante la creazione",
        details: "createSubscriber returned null"
      }, { status: 500 });
    }
    
    console.log('✅ Subscriber creato:', {
      id: newSubscriber.id,
      email: newSubscriber.email,
      subscription_status: newSubscriber.subscription_status,
      is_active: newSubscriber.is_active,
      created_at: newSubscriber.created_at
    });
    
    return NextResponse.json({
      success: true,
      message: "Subscriber creato con successo",
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email,
        first_name: newSubscriber.first_name,
        last_name: newSubscriber.last_name,
        project_name: newSubscriber.project_name,
        subscription_status: newSubscriber.subscription_status,
        is_active: newSubscriber.is_active,
        subscription_price: newSubscriber.subscription_price,
        created_at: newSubscriber.created_at
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    console.error("❌ Errore nel debug create subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}