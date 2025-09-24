import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/test-auth - Test autenticazione con email e password
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email e password sono obbligatori'
      }, { status: 400 });
    }

    // Test autenticazione
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Autenticazione riuscita',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        email_confirmed_at: data.user?.email_confirmed_at
      }
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Errore test autenticazione:', error);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Unknown error'
    }, { status: 500 });
  }
}

