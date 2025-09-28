import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth-server";

// GET /api/debug-session - Debug sessione dettagliata
export async function GET() {
  try {
    console.log('🔍 DEBUG: Verificando sessione dettagliata...');
    
    const supabase = await createClient();
    
    // Prova a ottenere la sessione
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('📋 Sessione:', session ? 'Presente' : 'Assente');
    console.log('📋 Errore sessione:', sessionError);
    
    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: "Errore lettura sessione",
        details: sessionError.message,
        code: sessionError.status
      }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Nessuna sessione attiva",
        message: "Fai il login per accedere alle funzionalità"
      }, { status: 401 });
    }
    
    // Prova a ottenere l'utente
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('👤 Utente:', user ? user.email : 'Non trovato');
    console.log('👤 Errore utente:', userError);
    
    return NextResponse.json({
      success: true,
      message: "Sessione attiva",
      session: {
        access_token: session.access_token ? 'Presente' : 'Assente',
        refresh_token: session.refresh_token ? 'Presente' : 'Assente',
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type
      },
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      } : null,
      errors: {
        sessionError: sessionError?.message,
        userError: userError?.message
      }
    });
    
  } catch (error: unknown) {
    console.error("❌ Errore generale:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : "Errore sconosciuto",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
