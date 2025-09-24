import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/create-admin - Crea utente admin in Supabase Auth
export async function POST() {
  try {
    const email = 'admin@admin.it';
    const password = 'admin123';
    
    // Crea l'utente in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Conferma automaticamente l'email
    });

    if (error) {
      console.error('Errore creazione utente:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Utente admin creato con successo',
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });

  } catch (error: any) {
    console.error('Errore creazione admin:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

