import { NextResponse } from "next/server";

// GET /api/debug-login - Test login con parametri URL
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const password = url.searchParams.get('password');
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Parametri mancanti",
        message: "Usa: /api/debug-login?email=your-email&password=your-password",
        example: "/api/debug-login?email=admin@example.com&password=yourpassword"
      }, { status: 400 });
    }
    
    // Importa supabase dinamicamente per evitare problemi SSR
    const { supabase } = await import('@/lib/supabase');
    
    console.log('📝 Tentativo login per:', email);
    
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
    
    return NextResponse.json({
      success: true,
      message: "Login riuscito",
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
    
  } catch (error: unknown) {
    console.error("❌ Errore generale:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : "Errore sconosciuto"
    }, { status: 500 });
  }
}