import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST /api/debug-edge-create - Debug per testare la creazione subscriber
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug edge create endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const {
      firstName,
      lastName,
      email,
      projectName,
      softwareId,
      vercelToken,
      vercelTeamId,
      subscriptionPrice,
      supabaseInfo,
      customConfig,
      edgeConfigId,
      edgeKey,
      notes,
      subscriptionStatus,
    } = body;

    console.log('🔍 Campi ricevuti:', {
      firstName: !!firstName,
      lastName: !!lastName,
      email: !!email,
      projectName: !!projectName,
      softwareId: !!softwareId,
      vercelToken: !!vercelToken,
      subscriptionPrice: !!subscriptionPrice,
      subscriptionStatus
    });

    // Validazione input
    if (!firstName || !lastName || !email || !projectName || !softwareId || !vercelToken || subscriptionPrice === undefined || subscriptionPrice === null) {
      console.log('❌ Validazione fallita - campi mancanti');
      return NextResponse.json({ 
        error: "Tutti i campi obbligatori devono essere compilati",
        received: {
          firstName: !!firstName,
          lastName: !!lastName,
          email: !!email,
          projectName: !!projectName,
          githubRepoTemplate: !!githubRepoTemplate,
          vercelToken: !!vercelToken,
          subscriptionPrice: subscriptionPrice,
          subscriptionPriceType: typeof subscriptionPrice
        }
      }, { status: 400 });
    }

    // Validazione stato abbonamento
    if (subscriptionStatus && !['PENDING', 'ACTIVE'].includes(subscriptionStatus)) {
      return NextResponse.json({ error: "Stato abbonamento non valido. Deve essere 'PENDING' o 'ACTIVE'" }, { status: 400 });
    }

    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    // Prepara i dati per l'inserimento
    const subscriberData = {
      first_name: firstName,
      last_name: lastName,
      email,
      project_name: projectName,
      software_id: softwareId,
      client_slug: clientSlug,
      vercel_token: vercelToken,
      vercel_team_id: vercelTeamId,
      subscription_price: subscriptionPrice,
      supabase_info: supabaseInfo,
      custom_config: customConfig || {},
      edge_config_id: edgeConfigId,
      edge_key: edgeKey || 'maintenance',
      notes,
      subscription_status: subscriptionStatus || 'PENDING',
      is_active: subscriptionStatus === 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Dati preparati per inserimento:', {
      ...subscriberData,
      vercel_token: '***HIDDEN***' // Nascondi token sensibile
    });

    // Test connessione Supabase
    console.log('🔍 Test connessione Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('subscribers')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Errore connessione Supabase:', testError);
      return NextResponse.json({ 
        error: "Errore connessione Supabase",
        details: testError.message,
        code: testError.code
      }, { status: 500 });
    }

    console.log('✅ Connessione Supabase OK');

    // Inserimento diretto nel database con controllo esplicito
    console.log('💾 Inserimento subscriber...');
    const { data: newSubscriber, error } = await supabase
      .from('subscribers')
      .insert(subscriberData)
      .select()
      .single();

    if (error) {
      console.error('❌ Errore Supabase:', error);
      return NextResponse.json({ 
        error: "Errore nella creazione subscriber",
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('✅ Subscriber creato con successo:', {
      id: newSubscriber.id,
      email: newSubscriber.email,
      subscription_status: newSubscriber.subscription_status,
      is_active: newSubscriber.is_active,
      created_at: newSubscriber.created_at
    });

    return NextResponse.json({
      success: true,
      message: "Subscriber creato con successo tramite debug endpoint",
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
    console.error("❌ Errore nel debug edge create:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
