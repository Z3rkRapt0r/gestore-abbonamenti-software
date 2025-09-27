import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";

// POST /api/subscribers - Crea nuovo abbonato
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

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
      subscriptionStatus,
    } = body;

    // Validazione input
    if (!firstName || !lastName || !email || !projectName || !softwareId || !vercelToken || !subscriptionPrice) {
      return NextResponse.json({ error: "Tutti i campi obbligatori devono essere compilati" }, { status: 400 });
    }

    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    // Crea il subscriber con stato selezionato dall'admin
    const newSubscriber = await db.createSubscriber({
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
      custom_config: customConfig,
      edge_config_id: edgeConfigId,
      edge_key: edgeKey || 'maintenance',
      notes,
      subscription_status: subscriptionStatus || 'PENDING', // Stato selezionato dall'admin
      is_active: subscriptionStatus === 'ACTIVE', // Attivo solo se stato è ACTIVE
    });

    if (!newSubscriber) {
      return NextResponse.json({ error: "Errore nella creazione abbonato" }, { status: 500 });
    }

    return NextResponse.json(newSubscriber, { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione abbonato:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

// GET /api/subscribers - Recupera tutti gli abbonati
export async function GET() {
  try {
    await requireAuth();

    const subscribers = await db.getSubscribers();

    return NextResponse.json(subscribers);
  } catch (error) {
    console.error("Errore nel recupero abbonati:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}