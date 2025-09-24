import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";

// PUT /api/subscribers/[id]/maintenance - Imposta maintenance true/false via Edge Config del cliente
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const desired = body?.maintenance === true; // true per bloccare, false per riattivare

    const subscriber = await db.getSubscriberById(id);
    if (!subscriber) {
      return NextResponse.json({ error: "Abbonato non trovato" }, { status: 404 });
    }

    const vercelToken: string | undefined = subscriber.vercel_token;
    const vercelTeamId: string | undefined = subscriber.vercel_team_id;
    const edgeConfigId: string | undefined = subscriber.edge_config_id;
    const edgeKey: string = subscriber.edge_key || 'maintenance';

    if (!vercelToken || !edgeConfigId) {
      return NextResponse.json({
        error: "Dati mancanti",
        missing: {
          vercel_token: !vercelToken,
          edge_config_id: !edgeConfigId,
        }
      }, { status: 400 });
    }

    // Vercel Edge Config Items API
    // Docs: https://vercel.com/docs/storage/edge-config/api
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
          { operation: 'upsert', key: edgeKey, value: desired }
        ]
      })
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Errore Edge Config', status: res.status, detail: text }, { status: 502 });
    }

    return NextResponse.json({ success: true, maintenance: desired });
  } catch (error) {
    console.error('Errore maintenance toggle:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}



