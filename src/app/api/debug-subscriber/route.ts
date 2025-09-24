import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/debug-subscriber - Debug creazione abbonato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📝 Dati ricevuti:", body);

    // Genera slug cliente
    const clientSlug = body.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    console.log("🔗 Client slug generato:", clientSlug);

    const subscriberData = {
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      project_name: body.projectName,
      github_repo_template: body.githubRepoTemplate,
      client_slug: clientSlug,
      vercel_token: body.vercelToken,
      vercel_team_id: body.vercelTeamId || null,
      subscription_price: body.subscriptionPrice,
      supabase_info: body.supabaseInfo || null,
      custom_config: body.customConfig || null,
      notes: body.notes || null,
      subscription_status: 'ACTIVE',
      is_active: true,
    };

    console.log("📊 Dati per il database:", subscriberData);

    const newSubscriber = await db.createSubscriber(subscriberData);
    console.log("✅ Risultato creazione:", newSubscriber);

    if (!newSubscriber) {
      return NextResponse.json({ 
        success: false,
        error: "Errore nella creazione abbonato",
        debug: {
          input: body,
          processed: subscriberData
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Abbonato creato con successo",
      subscriber: newSubscriber
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

