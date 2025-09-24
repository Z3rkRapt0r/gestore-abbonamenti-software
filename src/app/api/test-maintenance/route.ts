import { NextRequest, NextResponse } from "next/server";

// POST /api/test-maintenance - Test della funzione di manutenzione Vercel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberId, maintenance, edgeConfigId, edgeKey, vercelToken, vercelTeamId } = body;

    // Validazione input
    if (!subscriberId || maintenance === undefined) {
      return NextResponse.json({ 
        error: "Parametri mancanti: subscriberId e maintenance sono obbligatori" 
      }, { status: 400 });
    }

    if (!edgeConfigId || !vercelToken) {
      return NextResponse.json({ 
        error: "Per testare la funzione Vercel sono necessari edgeConfigId e vercelToken" 
      }, { status: 400 });
    }

    console.log('🧪 Test manutenzione Vercel:', {
      subscriberId,
      maintenance,
      edgeConfigId,
      edgeKey: edgeKey || 'maintenance',
      vercelToken: vercelToken.substring(0, 10) + '...',
      vercelTeamId
    });

    // Simula la chiamata all'API Vercel Edge Config
    const base = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`;
    const qs = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : '';

    const res = await fetch(base + qs, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          { operation: 'upsert', key: edgeKey || 'maintenance', value: maintenance }
        ]
      })
    });

    const responseText = await res.text();
    console.log('📡 Risposta Vercel API:', {
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
        url: base + qs
      }, { status: 502 });
    }

    return NextResponse.json({ 
      success: true, 
      maintenance,
      message: `Manutenzione ${maintenance ? 'ATTIVATA' : 'DISATTIVATA'} con successo`,
      edgeConfigId,
      edgeKey: edgeKey || 'maintenance',
      vercelResponse: responseText
    });

  } catch (error: unknown) {
    const err = error as { message?: string; stack?: string };
    console.error('❌ Errore test manutenzione:', error);
    return NextResponse.json({ 
      error: err?.message || 'Unknown error',
      stack: err?.stack
    }, { status: 500 });
  }
}
