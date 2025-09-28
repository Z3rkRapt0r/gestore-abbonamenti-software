import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";

// GET /api/software - Recupera tutti i software
export async function GET() {
  try {
    // Temporaneamente disabilito l'autenticazione per permettere visualizzazione
    // await requireAuth();
    
    const software = await db.getAllSoftware();
    
    return NextResponse.json({
      success: true,
      software,
    });
  } catch (error: unknown) {
    console.error("Errore nel recupero software:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}

// POST /api/software - Crea nuovo software
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const {
      name,
      description,
      github_repo_template,
      github_token,
      payment_template_subject,
      payment_template_body,
      is_active
    } = body;

    // Validazione campi obbligatori
    if (!name || !github_repo_template || !github_token || !payment_template_subject || !payment_template_body) {
      return NextResponse.json({ 
        error: "Nome, repository template, token GitHub, oggetto e corpo email sono obbligatori" 
      }, { status: 400 });
    }

    // Crea il software
    const software = await db.createSoftware({
      name,
      description: description || "",
      github_repo_template,
      github_token,
      payment_template_subject,
      payment_template_body,
      is_active: is_active !== false, // default true
    });

    if (!software) {
      return NextResponse.json({ 
        error: "Errore durante la creazione del software" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Software creato con successo",
      software,
    });
  } catch (error: unknown) {
    console.error("Errore nella creazione software:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}
