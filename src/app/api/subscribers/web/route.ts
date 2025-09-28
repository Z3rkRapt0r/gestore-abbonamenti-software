import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/subscribers/web - Crea nuovo abbonato (versione web senza autenticazione server-side)
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
      notes,
    } = body;

    // Validazione input
    if (!firstName || !lastName || !email || !projectName || !softwareId || !vercelToken || !subscriptionPrice) {
      return NextResponse.json({ error: "Tutti i campi obbligatori devono essere compilati" }, { status: 400 });
    }

    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

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
      notes,
      subscription_status: 'ACTIVE',
      is_active: true,
    });

    if (!newSubscriber) {
      return NextResponse.json({ error: "Errore nella creazione abbonato" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Abbonato creato con successo",
      subscriber: newSubscriber
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Errore nella creazione abbonato:", error);
    return NextResponse.json({ 
      success: false,
      error: err?.message || 'Unknown error' 
    }, { status: 500 });
  }
}

