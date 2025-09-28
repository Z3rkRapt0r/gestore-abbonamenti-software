import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST /api/edge-create-subscriber - Edge function per creazione subscriber con controllo stato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Edge-create-subscriber received body:', body);
    
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
      subscriptionType,
    } = body;

    console.log('🔍 Extracted fields:', {
      firstName, lastName, email, projectName, softwareId, 
      vercelToken: vercelToken ? 'Present' : 'Missing',
      subscriptionPrice, subscriptionStatus, subscriptionType
    });

    // Validazione input
    if (!firstName || !lastName || !email || !projectName || !softwareId || subscriptionPrice === undefined || subscriptionPrice === null || subscriptionPrice === '') {
      console.log('❌ Validation failed - missing required fields');
      return NextResponse.json({ error: "Tutti i campi obbligatori devono essere compilati" }, { status: 400 });
    }

    // Converti subscriptionPrice in numero se è una stringa
    const numericSubscriptionPrice = typeof subscriptionPrice === 'string' ? parseFloat(subscriptionPrice) : subscriptionPrice;
    
    if (isNaN(numericSubscriptionPrice)) {
      return NextResponse.json({ error: "Il prezzo dell'abbonamento deve essere un numero valido" }, { status: 400 });
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
      vercel_token: vercelToken || '',
      vercel_team_id: vercelTeamId,
      subscription_price: numericSubscriptionPrice,
      supabase_info: supabaseInfo,
      custom_config: customConfig || {},
      edge_config_id: edgeConfigId,
      edge_key: edgeKey || 'maintenance',
      notes,
      subscription_status: subscriptionStatus || 'PENDING', // Forza PENDING se non specificato
      is_active: subscriptionStatus === 'ACTIVE', // Forza false se non ACTIVE
      subscription_type: subscriptionType || 'monthly', // Default mensile
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };


    // Inserimento diretto nel database con controllo esplicito
    const { data: newSubscriber, error } = await supabase
      .from('subscribers')
      .insert(subscriberData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: "Errore nella creazione subscriber",
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Subscriber creato con successo tramite Edge function",
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
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
