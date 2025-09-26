import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// POST /api/debug-create-flow - Debug completo del flusso di creazione
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

    console.log('🔍 Debug flusso creazione subscriber:', { firstName, lastName, email, projectName, subscriptionPrice });

    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    // Step 1: Crea subscriber con stato PENDING
    console.log('📝 Step 1: Creazione subscriber...');
    const { data: newSubscriber, error: createError } = await supabase
      .from('subscribers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        project_name: projectName,
        client_slug: clientSlug,
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

    console.log('✅ Step 1 completato:', {
      id: newSubscriber.id,
      status: newSubscriber.subscription_status,
      active: newSubscriber.is_active
    });

    // Step 2: Verifica immediata (dopo 100ms)
    console.log('⏱️ Step 2: Verifica immediata...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: immediateCheck, error: immediateError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', newSubscriber.id)
      .single();

    console.log('✅ Step 2 completato:', {
      status: immediateCheck?.subscription_status,
      active: immediateCheck?.is_active
    });

    // Step 3: Verifica dopo 1 secondo
    console.log('⏱️ Step 3: Verifica dopo 1 secondo...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: delayedCheck, error: delayedError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', newSubscriber.id)
      .single();

    console.log('✅ Step 3 completato:', {
      status: delayedCheck?.subscription_status,
      active: delayedCheck?.is_active
    });

    // Step 4: Verifica dopo 3 secondi
    console.log('⏱️ Step 4: Verifica dopo 3 secondi...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', newSubscriber.id)
      .single();

    console.log('✅ Step 4 completato:', {
      status: finalCheck?.subscription_status,
      active: finalCheck?.is_active
    });

    return NextResponse.json({
      success: true,
      message: "Debug flusso completato",
      subscriber: newSubscriber,
      timeline: {
        created: {
          status: newSubscriber.subscription_status,
          active: newSubscriber.is_active,
          timestamp: new Date().toISOString()
        },
        immediate: {
          status: immediateCheck?.subscription_status,
          active: immediateCheck?.is_active,
          timestamp: new Date().toISOString()
        },
        delayed: {
          status: delayedCheck?.subscription_status,
          active: delayedCheck?.is_active,
          timestamp: new Date().toISOString()
        },
        final: {
          status: finalCheck?.subscription_status,
          active: finalCheck?.is_active,
          timestamp: new Date().toISOString()
        }
      },
      debug: {
        status_changed: newSubscriber.subscription_status !== finalCheck?.subscription_status,
        active_changed: newSubscriber.is_active !== finalCheck?.is_active,
        changes: {
          status: newSubscriber.subscription_status !== finalCheck?.subscription_status ? 
            `${newSubscriber.subscription_status} → ${finalCheck?.subscription_status}` : 'Nessun cambiamento',
          active: newSubscriber.is_active !== finalCheck?.is_active ? 
            `${newSubscriber.is_active} → ${finalCheck?.is_active}` : 'Nessun cambiamento'
        }
      }
    });

  } catch (error: unknown) {
    console.error("Errore nel debug flusso creazione:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
