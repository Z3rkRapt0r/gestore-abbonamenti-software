import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/debug-create-software - Debug creazione software
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Inizio creazione software...');
    
    const body = await request.json();
    console.log('📝 Body ricevuto:', body);
    
    const {
      name,
      description,
      github_repo_template,
      github_token,
      payment_template_subject,
      payment_template_body,
      is_active
    } = body;

    // Validazione campi obbligatori
    if (!name || !github_repo_template || !github_token || !payment_template_subject || !payment_template_body) {
      console.log('❌ Validazione fallita - campi mancanti');
      return NextResponse.json({ 
        error: "Nome, repository template, token GitHub, oggetto e corpo email sono obbligatori",
        received: { name, github_repo_template, github_token, payment_template_subject, payment_template_body }
      }, { status: 400 });
    }

    console.log('✅ Validazione OK, procedo con creazione...');

    // Test connessione Supabase
    console.log('🔗 Test connessione Supabase...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('software')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Errore connessione Supabase:', testError);
      return NextResponse.json({
        error: "Errore connessione database",
        details: testError.message,
        code: testError.code
      }, { status: 500 });
    }
    
    console.log('✅ Connessione Supabase OK');

    // Prova a creare il software
    console.log('📝 Creazione software...');
    const { data, error } = await supabaseAdmin
      .from('software')
      .insert({
        name,
        description: description || "",
        github_repo_template,
        github_token,
        payment_template_subject,
        payment_template_body,
        is_active: is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Errore creazione software:', error);
      return NextResponse.json({
        error: "Errore durante la creazione del software",
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('✅ Software creato con successo:', data);

    return NextResponse.json({
      success: true,
      message: "Software creato con successo",
      software: data
    });

  } catch (error: unknown) {
    console.error("❌ Errore generale:", error);
    return NextResponse.json({
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : "Errore sconosciuto",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
