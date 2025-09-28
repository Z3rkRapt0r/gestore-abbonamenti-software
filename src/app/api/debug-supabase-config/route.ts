import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/debug-supabase-config - Debug configurazione Supabase
export async function GET() {
  try {
    console.log('🔍 DEBUG: Verificando configurazione Supabase...');

    // Verifica variabili d'ambiente
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Presente' : '❌ Mancante',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Presente' : '❌ Mancante',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Presente' : '❌ Mancante',
      nodeEnv: process.env.NODE_ENV || 'undefined'
    };

    console.log('📋 Configurazione:', config);

    // Test connessione base
    console.log('🔗 Test connessione Supabase...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('software')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Errore connessione:', testError);
      return NextResponse.json({
        success: false,
        error: "Errore connessione Supabase",
        details: testError.message,
        code: testError.code,
        hint: testError.hint,
        config
      }, { status: 500 });
    }

    console.log('✅ Connessione Supabase OK');

    // Test lettura software
    console.log('📖 Test lettura software...');
    const { data: softwareData, error: softwareError } = await supabaseAdmin
      .from('software')
      .select('*')
      .limit(5);

    if (softwareError) {
      console.log('❌ Errore lettura software:', softwareError);
      return NextResponse.json({
        success: false,
        error: "Errore lettura software",
        details: softwareError.message,
        code: softwareError.code,
        hint: softwareError.hint,
        config
      }, { status: 500 });
    }

    console.log('✅ Lettura software OK, trovati:', softwareData?.length || 0, 'software');

    return NextResponse.json({
      success: true,
      message: "Configurazione Supabase OK",
      config,
      softwareCount: softwareData?.length || 0,
      software: softwareData || []
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
