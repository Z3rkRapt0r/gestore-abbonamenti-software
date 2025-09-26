import { NextRequest, NextResponse } from "next/server";

// POST /api/debug-webhook-test - Test endpoint per verificare che il webhook risponda
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test webhook endpoint chiamato');
    
    const body = await request.json();
    console.log('📋 Body ricevuto:', body);
    
    return NextResponse.json({
      success: true,
      message: "Webhook endpoint funziona correttamente",
      received: body,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel test webhook:", error);
    return NextResponse.json({ 
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
