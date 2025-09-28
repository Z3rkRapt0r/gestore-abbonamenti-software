import { NextResponse } from "next/server";
import { db } from "@/lib/database";

// GET /api/test - Test connessione Supabase senza autenticazione
export async function GET() {
  try {
    // Test connessione base - ora testiamo con i software invece delle configurazioni
    const software = await db.getActiveSoftware();
    
    return NextResponse.json({
      success: true,
      message: "Connessione Supabase funzionante",
      activeSoftwareCount: software.length,
      software: software.map(s => ({ id: s.id, name: s.name })),
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Errore test Supabase:", error);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

