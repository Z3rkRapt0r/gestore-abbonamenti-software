import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// POST /api/save-config - Salva configurazione (versione semplificata)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubToken, githubUsername, stripeSecretKey, stripeWebhookSecret, maintenanceDeploymentId } = body;

    // Validazione input
    if (!githubToken || !githubUsername || !stripeSecretKey || !stripeWebhookSecret) {
      return NextResponse.json({ 
        success: false,
        error: "Tutti i campi sono obbligatori" 
      }, { status: 400 });
    }

    console.log('💾 Salvataggio configurazione:', { githubUsername });

    // Prima controlla se esiste già una configurazione
    const { data: existingConfig } = await supabase
      .from('configurations')
      .select('id')
      .limit(1)
      .single();

    const configId = existingConfig?.id || '550e8400-e29b-41d4-a716-446655440000'; // UUID fisso per la configurazione

    // Salva la configurazione nel database
    const { data, error } = await supabase
      .from('configurations')
      .upsert({
        id: configId,
        github_token: githubToken,
        github_username: githubUsername,
        stripe_secret_key: stripeSecretKey,
        stripe_webhook_secret: stripeWebhookSecret,
        maintenance_deployment_id: maintenanceDeploymentId || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Errore salvataggio configurazione:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Configurazione salvata con successo');

    return NextResponse.json({
      success: true,
      message: "Configurazione salvata con successo",
      config: {
        id: data.id,
        github_username: data.github_username,
        updated_at: data.updated_at
      }
    }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("❌ Errore nel salvataggio configurazione:", error);
    return NextResponse.json({ 
      success: false,
      error: err?.message || 'Unknown error' 
    }, { status: 500 });
  }
}

// GET /api/save-config - Recupera configurazione
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configurations')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Errore recupero configurazione:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        success: true,
        config: null 
      });
    }

    // Mascara le chiavi sensibili per la risposta
    const safeConfig = {
      ...data,
      stripe_secret_key: data.stripe_secret_key ? "••••••••••••••••••••••••••••••••" : null,
      stripe_webhook_secret: data.stripe_webhook_secret ? "••••••••••••••••••••••••••••••••" : null,
    };

    return NextResponse.json({
      success: true,
      config: safeConfig
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("❌ Errore nel recupero configurazione:", error);
    return NextResponse.json({ 
      success: false,
      error: err?.message || 'Unknown error' 
    }, { status: 500 });
  }
}
