import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";

// DELETE /api/debug-delete-software/[id] - Debug eliminazione software
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 DEBUG: Inizio eliminazione software...');
    
    await requireAuth();
    const { id } = await context.params;
    
    console.log('📝 ID software da eliminare:', id);
    
    // Verifica che il software esista
    console.log('🔍 Verifico esistenza software...');
    const existingSoftware = await db.getSoftwareById(id);
    if (!existingSoftware) {
      console.log('❌ Software non trovato');
      return NextResponse.json({ error: "Software non trovato" }, { status: 404 });
    }
    
    console.log('✅ Software trovato:', existingSoftware.name);

    // Verifica se ci sono subscriber collegati
    console.log('🔍 Verifico subscriber collegati...');
    const subscribers = await db.getSubscribers();
    const linkedSubscribers = subscribers.filter(s => s.software_id === id);
    
    console.log('📊 Subscriber collegati:', linkedSubscribers.length);
    if (linkedSubscribers.length > 0) {
      console.log('⚠️ Ci sono subscriber collegati:', linkedSubscribers.map(s => s.email));
      return NextResponse.json({ 
        error: "Impossibile eliminare: ci sono subscriber collegati a questo software",
        linkedSubscribers: linkedSubscribers.map(s => ({ id: s.id, email: s.email, name: s.first_name + ' ' + s.last_name }))
      }, { status: 400 });
    }

    // Prova eliminazione
    console.log('🗑️ Tentativo eliminazione software...');
    const deleteResult = await db.deleteSoftware(id);
    
    if (!deleteResult) {
      console.log('❌ Eliminazione fallita');
      return NextResponse.json({ 
        error: "Errore durante l'eliminazione" 
      }, { status: 500 });
    }

    console.log('✅ Software eliminato con successo');

    return NextResponse.json({
      success: true,
      message: "Software eliminato con successo",
      deletedSoftware: existingSoftware.name
    });
  } catch (error: unknown) {
    console.error("❌ Errore nell'eliminazione software:", error);
    return NextResponse.json({ 
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : "Errore sconosciuto",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
