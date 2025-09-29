import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PUT /api/dashboard/project-status - Toggle stato progetto per abbonato
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId, isOnline } = body;

    if (!subscriberId || isOnline === undefined) {
      return NextResponse.json({ 
        error: "Parametri mancanti: subscriberId e isOnline sono obbligatori" 
      }, { status: 400 });
    }

    console.log('🌐 Toggle gestione progetto:', { subscriberId, isOnline });

    // Recupera i dati dell'abbonato
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single();

    if (fetchError || !subscriber) {
      console.error('❌ Abbonato non trovato:', fetchError);
      return NextResponse.json({ 
        error: "Abbonato non trovato" 
      }, { status: 404 });
    }

    const { vercel_token, vercel_team_id, edge_config_id, edge_key, subscription_status } = subscriber;

    if (!vercel_token || !edge_config_id) {
      return NextResponse.json({
        error: "Dati mancanti",
        missing: {
          vercel_token: !vercel_token,
          edge_config_id: !edge_config_id,
        }
      }, { status: 400 });
    }

    // Determina lo stato finale del progetto
    // Se l'abbonamento non è attivo, forza offline indipendentemente dalla richiesta manuale
    const finalProjectStatus = subscription_status === 'ACTIVE' ? isOnline : false;
    
    // Calcola la data di disattivazione automatica se il progetto viene impostato online
    // Usa sempre la next_billing_date disponibile (senza controllo temporale)
    const autoDisableDate = (finalProjectStatus && subscription_status === 'ACTIVE' && subscriber.next_billing_date)
      ? new Date(subscriber.next_billing_date).toISOString()
      : null;
    
    console.log('📡 Chiamata API Vercel:', {
      edgeConfigId: edge_config_id,
      edgeKey: edge_key || 'maintenance',
      requestedOnline: isOnline,
      subscriptionStatus: subscription_status,
      finalProjectStatus,
      autoDisableDate,
      vercelToken: vercel_token.substring(0, 10) + '...',
      vercelTeamId: vercel_team_id
    });

    // Chiamata API Vercel Edge Config
    const base = `https://api.vercel.com/v1/edge-config/${edge_config_id}/items`;
    const qs = vercel_team_id ? `?teamId=${encodeURIComponent(vercel_team_id)}` : '';

    const res = await fetch(base + qs, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercel_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          { operation: 'upsert', key: edge_key || 'maintenance', value: !finalProjectStatus }
        ]
      })
    });

    const responseText = await res.text();
    console.log('📡 Risposta Vercel:', {
      status: res.status,
      statusText: res.statusText,
      body: responseText
    });

    if (!res.ok) {
      return NextResponse.json({ 
        error: 'Errore Edge Config Vercel',
        status: res.status,
        statusText: res.statusText,
        detail: responseText,
        subscriber: {
          id: subscriber.id,
          name: `${subscriber.first_name} ${subscriber.last_name}`,
          project: subscriber.project_name
        }
      }, { status: 502 });
    }

    // Determina il messaggio di risposta
    let message = '';
    if (subscription_status !== 'ACTIVE') {
      message = `Progetto impostato OFFLINE automaticamente per abbonamento non attivo (${subscriber.first_name} ${subscriber.last_name})`;
    } else {
      message = `Progetto ${finalProjectStatus ? 'ONLINE' : 'OFFLINE'} per ${subscriber.first_name} ${subscriber.last_name}`;
    }

    return NextResponse.json({ 
      success: true, 
      isOnline: finalProjectStatus,
      subscriptionStatus: subscription_status,
      autoDisableDate,
      message,
      subscriber: {
        id: subscriber.id,
        name: `${subscriber.first_name} ${subscriber.last_name}`,
        project: subscriber.project_name
      }
    });

  } catch (error: any) {
    console.error('❌ Errore toggle gestione progetto:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// GET /api/dashboard/project-status?subscriberId=... - Legge lo stato corrente del progetto da Vercel Edge Config
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriberId = searchParams.get('subscriberId');

    if (!subscriberId) {
      return NextResponse.json({ error: 'subscriberId richiesto' }, { status: 400 });
    }

    // Recupera i dati dell'abbonato
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single();

    if (fetchError || !subscriber) {
      return NextResponse.json({ error: 'Abbonato non trovato' }, { status: 404 });
    }

    const { vercel_token, vercel_team_id, edge_config_id, edge_key, subscription_status, next_billing_date } = subscriber;

    if (!vercel_token || !edge_config_id) {
      return NextResponse.json({
        error: 'Dati Vercel mancanti',
        missing: {
          vercel_token: !vercel_token,
          edge_config_id: !edge_config_id,
        }
      }, { status: 400 });
    }

    // Usa chiamata specifica per key (meno rate limited rispetto al fetch completo)
    const base = `https://api.vercel.com/v1/edge-config/${edge_config_id}/items`;
    const keyName = edge_key || 'maintenance';
    const qsKey = vercel_team_id
      ? `?teamId=${encodeURIComponent(vercel_team_id)}&key=${encodeURIComponent(keyName)}`
      : `?key=${encodeURIComponent(keyName)}`;

    let maintenanceValue: boolean | null = null;
    let resKey = await fetch(base + qsKey, {
      method: 'GET',
      headers: { Authorization: `Bearer ${vercel_token}` }
    });

    if (resKey.status === 429) {
      const txt = await resKey.text();
      console.warn('[project-status:get] 429 rate limited on key read, backing off 1500ms', txt);
      await new Promise(r => setTimeout(r, 1500));
      resKey = await fetch(base + qsKey, {
        method: 'GET',
        headers: { Authorization: `Bearer ${vercel_token}` }
      });
    }

    if (resKey.ok) {
      const dataKey = await resKey.json() as { item?: { key: string; value: unknown } };
      console.log('[project-status:get] Key response:', JSON.stringify(dataKey));
      maintenanceValue = dataKey.item ? Boolean((dataKey.item as any).value) : null;
    } else {
      const txt = await resKey.text();
      console.error('❌ Errore lettura Edge Config (key):', {
        status: resKey.status,
        statusText: resKey.statusText,
        body: txt,
        edgeConfigId: edge_config_id,
        vercelTeamId: vercel_team_id,
        keyName,
        url: base + qsKey
      });
    }

    // Se ancora non determinato, prova un retry dopo un breve delay
    if (maintenanceValue === null) {
      console.log('[project-status:get] Key not found, retrying after delay...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry della lettura
      const retryRes = await fetch(base + qsKey, {
        method: 'GET',
        headers: { Authorization: `Bearer ${vercel_token}` }
      });
      
      if (retryRes.ok) {
        const dataKey = await retryRes.json() as { item?: { key: string; value: unknown } };
        console.log('[project-status:get] Retry response:', JSON.stringify(dataKey));
        maintenanceValue = dataKey.item ? Boolean((dataKey.item as any).value) : null;
        
        if (maintenanceValue !== null) {
          console.log('[project-status:get] Retry found key:', keyName, 'value:', maintenanceValue);
        } else {
          console.log('[project-status:get] Retry also failed, defaulting to offline');
          maintenanceValue = true;
        }
      } else {
        console.log('[project-status:get] Retry failed, defaulting to offline');
        maintenanceValue = true;
      }
    } else {
      console.log('[project-status:get] Found key:', keyName, 'value:', maintenanceValue);
    }

    const isOnline = !maintenanceValue;
    const autoDisableDate = (isOnline && next_billing_date) ? new Date(next_billing_date).toISOString() : null;

    const resp = NextResponse.json({
      success: true,
      isOnline,
      subscriptionStatus: subscription_status,
      autoDisableDate,
      debug: {
        edgeConfigId: edge_config_id,
        keyUsed: keyName,
        maintenanceRaw: maintenanceValue,
      }
    });
    resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return resp;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
