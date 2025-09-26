import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// POST /api/debug-create-subscriber - Debug della creazione subscriber
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      projectName, 
      subscriptionPrice = 29.99 
    } = body;

    if (!firstName || !lastName || !email || !projectName) {
      return NextResponse.json({ 
        error: "Dati mancanti",
        required: ["firstName", "lastName", "email", "projectName"]
      }, { status: 400 });
    }

    console.log('🔍 Debug creazione subscriber:', { firstName, lastName, email, projectName, subscriptionPrice });

    // Crea subscriber con stato PENDING
    const { data: newSubscriber, error: createError } = await supabase
      .from('subscribers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        project_name: projectName,
        subscription_price: subscriptionPrice,
        subscription_status: 'PENDING',
        is_active: false,
        edge_key: 'maintenance',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Errore creazione subscriber:', createError);
      return NextResponse.json({ 
        error: "Errore nella creazione subscriber",
        details: createError.message,
        code: createError.code
      }, { status: 500 });
    }

    console.log('✅ Subscriber creato:', newSubscriber);

    // Verifica immediatamente lo stato
    const { data: verifySubscriber, error: verifyError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', newSubscriber.id)
      .single();

    if (verifyError) {
      console.error('❌ Errore verifica subscriber:', verifyError);
    }

    return NextResponse.json({
      success: true,
      message: "Subscriber creato con successo",
      subscriber: newSubscriber,
      verification: verifySubscriber,
      debug: {
        created_status: newSubscriber.subscription_status,
        created_active: newSubscriber.is_active,
        verified_status: verifySubscriber?.subscription_status,
        verified_active: verifySubscriber?.is_active,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: unknown) {
    console.error("Errore nel debug creazione subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
