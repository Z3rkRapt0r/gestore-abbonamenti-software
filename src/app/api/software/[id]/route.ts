import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";

// GET /api/software/[id] - Recupera software specifico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const software = await db.getSoftwareById(id);
    if (!software) {
      return NextResponse.json({ error: "Software non trovato" }, { status: 404 });
    }

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

// PUT /api/software/[id] - Aggiorna software
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await context.params;
    
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

    // Verifica che il software esista
    const existingSoftware = await db.getSoftwareById(id);
    if (!existingSoftware) {
      return NextResponse.json({ error: "Software non trovato" }, { status: 404 });
    }

    // Aggiorna il software
    const updatedSoftware = await db.updateSoftware(id, {
      name,
      description: description || "",
      github_repo_template,
      github_token,
      payment_template_subject,
      payment_template_body,
      is_active: is_active !== false,
    });

    if (!updatedSoftware) {
      return NextResponse.json({ 
        error: "Errore durante l'aggiornamento" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Software aggiornato con successo",
      software: updatedSoftware,
    });
  } catch (error: unknown) {
    console.error("Errore nell'aggiornamento software:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}

// DELETE /api/software/[id] - Elimina software
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await context.params;
    
    // Verifica che il software esista
    const existingSoftware = await db.getSoftwareById(id);
    if (!existingSoftware) {
      return NextResponse.json({ error: "Software non trovato" }, { status: 404 });
    }

    // TODO: Verificare che non ci siano subscriber collegati a questo software
    // const subscribers = await db.getSubscribersBySoftwareId(id);
    // if (subscribers.length > 0) {
    //   return NextResponse.json({ 
    //     error: "Impossibile eliminare: ci sono subscriber collegati a questo software" 
    //   }, { status: 400 });
    // }

    // Elimina il software
    const deleteResult = await db.deleteSoftware(id);
    
    if (!deleteResult) {
      return NextResponse.json({ 
        error: "Errore durante l'eliminazione" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Software eliminato con successo",
    });
  } catch (error: unknown) {
    console.error("Errore nell'eliminazione software:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}
