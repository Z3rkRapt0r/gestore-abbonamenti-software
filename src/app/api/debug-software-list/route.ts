import { NextResponse } from "next/server";
import { db } from "@/lib/database";

// GET /api/debug-software-list - Debug lista software senza autenticazione
export async function GET() {
  try {
    console.log('🔍 DEBUG: Recupero software senza autenticazione...');
    
    const software = await db.getAllSoftware();
    
    console.log('✅ Software recuperati:', software.length);
    
    return NextResponse.json({
      success: true,
      count: software.length,
      software,
    });
  } catch (error: unknown) {
    console.error("❌ Errore nel recupero software:", error);
    return NextResponse.json({ 
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : "Errore sconosciuto"
    }, { status: 500 });
  }
}
