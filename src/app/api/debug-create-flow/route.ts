import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/debug-create-flow - Debug completo del flusso di creazione
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug create flow endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const {
      firstName,
      lastName,
      email,
      projectName,
      subscriptionPrice,
      subscriptionStatus
    } = body;
    
    if (!firstName || !lastName || !email || !projectName) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }
    
    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    
    const subscriberData = {
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
      subscription_status: subscriptionStatus || 'PENDING',
      is_active: subscriptionStatus === 'ACTIVE',
    };
    
    console.log('💾 Dati che verranno inviati al database:', subscriberData);
    
    // Crea il subscriber
    const newSubscriber = await db.createSubscriber(subscriberData);
    
    if (!newSubscriber) {
      console.log('❌ Errore durante creazione subscriber');
      return NextResponse.json({ 
        error: "Errore durante la creazione",
        details: "createSubscriber returned null"
      }, { status: 500 });
    }
    
    console.log('✅ Subscriber creato dal database:', {
      id: newSubscriber.id,
      email: newSubscriber.email,
      subscription_status: newSubscriber.subscription_status,
      is_active: newSubscriber.is_active,
      created_at: newSubscriber.created_at
    });
    
    // Verifica immediatamente dopo la creazione
    console.log('🔍 Verifica immediata dopo creazione...');
    const verifySubscriber = await db.getSubscriberById(newSubscriber.id);
    
    if (verifySubscriber) {
      console.log('✅ Verifica subscriber:', {
        id: verifySubscriber.id,
        subscription_status: verifySubscriber.subscription_status,
        is_active: verifySubscriber.is_active
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Debug creazione completato",
      input: {
        subscriptionStatus: subscriptionStatus,
        expectedIsActive: subscriptionStatus === 'ACTIVE'
      },
      created: {
        id: newSubscriber.id,
        email: newSubscriber.email,
        subscription_status: newSubscriber.subscription_status,
        is_active: newSubscriber.is_active,
        created_at: newSubscriber.created_at
      },
      verified: verifySubscriber ? {
        subscription_status: verifySubscriber.subscription_status,
        is_active: verifySubscriber.is_active
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    console.error("❌ Errore nel debug create flow:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}