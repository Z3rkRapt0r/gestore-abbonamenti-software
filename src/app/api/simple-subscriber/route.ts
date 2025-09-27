import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// POST /api/simple-subscriber - Crea nuovo abbonato (versione semplificata)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    } = body;

    // Validazione input
    if (!firstName || !lastName || !email || !projectName || !softwareId || !vercelToken || !subscriptionPrice) {
      return NextResponse.json({ error: "Tutti i campi obbligatori devono essere compilati" }, { status: 400 });
    }

    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    const subscriberData = {
      first_name: firstName,
      last_name: lastName,
      email,
      project_name: projectName,
      software_id: softwareId,
      client_slug: clientSlug,
      vercel_token: vercelToken,
      vercel_team_id: vercelTeamId || null,
      subscription_price: subscriptionPrice,
      supabase_info: supabaseInfo || null,
      custom_config: customConfig || null,
      edge_config_id: edgeConfigId || null,
      edge_key: edgeKey || 'maintenance',
      notes: notes || null,
      subscription_status: 'ACTIVE',
      is_active: true,
    };

    console.log('📝 Creazione subscriber con dati:', subscriberData);

    const { data, error } = await supabase
      .from('subscribers')
      .insert(subscriberData)
      .select()
      .single();

    if (error) {
      console.error('❌ Errore Supabase:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Abbonato creato con successo",
      subscriber: data
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; stack?: string };
    console.error("❌ Errore nella creazione abbonato:", error);
    return NextResponse.json({ 
      success: false,
      error: err?.message || 'Unknown error',
      stack: err?.stack
    }, { status: 500 });
  }
}

