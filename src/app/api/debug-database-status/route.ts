import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/debug-database-status - Verifica stato database
export async function GET() {
  try {
    console.log('🔍 Verificando stato database...');

    // Verifica se la tabella software esiste
    const { data: softwareData, error: softwareError } = await supabaseAdmin
      .from('software')
      .select('count')
      .limit(1);

    // Verifica se la tabella subscribers esiste
    const { data: subscribersData, error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .select('count')
      .limit(1);

    // Verifica se la tabella configurations esiste
    const { data: configData, error: configError } = await supabaseAdmin
      .from('configurations')
      .select('count')
      .limit(1);

    const status = {
      software: {
        exists: !softwareError,
        error: softwareError?.message || null,
        count: softwareData?.length || 0
      },
      subscribers: {
        exists: !subscribersError,
        error: subscribersError?.message || null,
        count: subscribersData?.length || 0
      },
      configurations: {
        exists: !configError,
        error: configError?.message || null,
        count: configData?.length || 0
      }
    };

    console.log('📊 Stato database:', status);

    return NextResponse.json({
      success: true,
      message: "Stato database verificato",
      status,
      recommendations: {
        software: softwareError ? "Esegui create-software-table.sql" : "Tabella software OK",
        configurations: configError ? "Tabella configurations non esiste (OK)" : "Esegui remove-configurations-table.sql"
      }
    });

  } catch (error: unknown) {
    console.error("❌ Errore verifica database:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
      message: "Impossibile verificare stato database"
    }, { status: 500 });
  }
}
