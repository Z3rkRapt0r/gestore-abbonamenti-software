import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";

// GET /api/debug-auth-test - Test autenticazione
export async function GET() {
  try {
    console.log('🔍 DEBUG: Test autenticazione...');
    
    const user = await requireAuth();
    
    console.log('✅ Autenticazione OK:', user.email);
    
    return NextResponse.json({
      success: true,
      message: "Autenticazione funzionante",
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error: unknown) {
    console.error("❌ Errore autenticazione:", error);
    return NextResponse.json({
      success: false,
      error: "Autenticazione fallita",
      details: error instanceof Error ? error.message : "Errore sconosciuto"
    }, { status: 401 });
  }
}
