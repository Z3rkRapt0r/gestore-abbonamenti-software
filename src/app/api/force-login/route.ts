import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/force-login - Forza login e sincronizza sessione
export async function POST(request: Request) {
  try {
    console.log('🔍 DEBUG: Forzando login e sincronizzazione...');
    
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email e password sono obbligatori"
      }, { status: 400 });
    }
    
    console.log('📝 Tentativo login forzato per:', email);
    
    // Prova il login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('❌ Errore login:', error.message);
      return NextResponse.json({
        success: false,
        error: "Login fallito",
        details: error.message,
        code: error.status
      }, { status: 401 });
    }
    
    console.log('✅ Login riuscito per:', data.user?.email);
    
    // Crea response con cookie impostati
    const response = NextResponse.json({
      success: true,
      message: "Login riuscito e sessione sincronizzata",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at,
        last_sign_in_at: data.user?.last_sign_in_at
      },
      session: {
        access_token: data.session?.access_token ? 'Presente' : 'Assente',
        refresh_token: data.session?.refresh_token ? 'Presente' : 'Assente',
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in
      }
    });
    
    // Imposta i cookie manualmente per sincronizzare la sessione
    if (data.session) {
      response.cookies.set('sb-nephqkwdovlmpuerqzoh-auth-token', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.user
      }), {
        maxAge: 60 * 60 * 24 * 7, // 7 giorni
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }
    
    return response;
    
  } catch (error: unknown) {
    console.error("❌ Errore generale:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : "Errore sconosciuto"
    }, { status: 500 });
  }
}
