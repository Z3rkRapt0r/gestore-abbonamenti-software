import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

// POST /api/debug-update-subscriber - Debug endpoint per testare aggiornamento subscriber
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug update subscriber endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    const { subscriberId, updates } = body;
    
    if (!subscriberId) {
      return NextResponse.json({ error: "ID subscriber richiesto" }, { status: 400 });
    }
    
    console.log('🔍 Cercando subscriber:', subscriberId);
    
    // Verifica che il subscriber esista
    const existingSubscriber = await db.getSubscriberById(subscriberId);
    if (!existingSubscriber) {
      console.log('❌ Subscriber non trovato:', subscriberId);
      return NextResponse.json({ error: "Subscriber non trovato" }, { status: 404 });
    }
    
    console.log('✅ Subscriber trovato:', {
      id: existingSubscriber.id,
      email: existingSubscriber.email,
      project_name: existingSubscriber.project_name
    });
    
    // Test aggiornamento minimo
    console.log('💾 Test aggiornamento con dati minimi...');
    const testUpdates = {
      notes: updates?.notes || 'Test update ' + new Date().toISOString()
    };
    
    const updatedSubscriber = await db.updateSubscriber(subscriberId, testUpdates);
    
    if (!updatedSubscriber) {
      console.log('❌ Errore durante aggiornamento subscriber');
      return NextResponse.json({ 
        error: "Errore durante l'aggiornamento",
        details: "updateSubscriber returned null"
      }, { status: 500 });
    }
    
    console.log('✅ Subscriber aggiornato con successo:', {
      id: updatedSubscriber.id,
      email: updatedSubscriber.email,
      notes: updatedSubscriber.notes
    });
    
    return NextResponse.json({
      success: true,
      message: "Test aggiornamento riuscito",
      original: existingSubscriber,
      updated: updatedSubscriber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    console.error("❌ Errore nel debug update subscriber:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
