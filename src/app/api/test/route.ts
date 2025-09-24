import { NextResponse } from "next/server";
import { db } from "@/lib/database";

// GET /api/test - Test connessione Supabase senza autenticazione
export async function GET() {
  try {
    // Test connessione base
    const configuration = await db.getConfiguration();
    
    return NextResponse.json({
      success: true,
      message: "Connessione Supabase funzionante",
      hasConfiguration: !!configuration,
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

