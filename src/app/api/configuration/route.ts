import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";
import bcrypt from "bcryptjs";

// GET /api/configuration - Recupera configurazione admin
export async function GET() {
  try {
    await requireAuth();

    const configuration = await db.getConfiguration();

    if (!configuration) {
      return NextResponse.json({ error: "Configurazione non trovata" }, { status: 404 });
    }

    // Rimuovi le chiavi sensibili dalla risposta
    const { stripe_secret_key, stripe_webhook_secret, ...safeConfig } = configuration;

    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error("Errore nel recupero configurazione:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

// PUT /api/configuration - Salva configurazione globale admin
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { githubToken, githubUsername, stripeSecretKey, stripeWebhookSecret } = body;

    // Validazione input
    if (!githubToken || !githubUsername) {
      return NextResponse.json({ error: "GitHub Token e Username sono obbligatori" }, { status: 400 });
    }

    // Cripta le chiavi sensibili
    const hashedStripeSecretKey = await bcrypt.hash(stripeSecretKey, 10);
    const hashedWebhookSecret = await bcrypt.hash(stripeWebhookSecret, 10);

    const configuration = await db.updateConfiguration({
      github_token: githubToken,
      github_username: githubUsername,
      stripe_secret_key: hashedStripeSecretKey,
      stripe_webhook_secret: hashedWebhookSecret,
      updated_at: new Date().toISOString(),
    });

    if (!configuration) {
      return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
    }

    // Rimuovi le chiavi sensibili dalla risposta
    const { stripe_secret_key: _sk, stripe_webhook_secret: _ws, ...safeConfig } = configuration;

    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error("Errore nel salvataggio configurazione:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}