import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";

// POST /api/test-subscriber - Test creazione abbonato senza autenticazione
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      projectName,
      githubRepoTemplate,
      vercelToken,
      vercelTeamId,
      subscriptionPrice,
      supabaseInfo,
      customConfig,
      notes,
    } = body;

    // Validazione input
    if (!firstName || !lastName || !email || !projectName || !githubRepoTemplate || !vercelToken || !subscriptionPrice) {
      return NextResponse.json({ error: "Tutti i campi obbligatori devono essere compilati" }, { status: 400 });
    }

    // Genera slug cliente
    const clientSlug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

    const newSubscriber = await db.createSubscriber({
      first_name: firstName,
      last_name: lastName,
      email,
      project_name: projectName,
      github_repo_template: githubRepoTemplate,
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
  } catch (error: any) {
    console.error("Errore nella creazione abbonato:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

