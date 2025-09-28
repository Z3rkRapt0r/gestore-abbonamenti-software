import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/debug-software-templates - Debug per verificare i template nel database
export async function GET() {
  try {
    console.log('🔍 DEBUG: Verificando template software nel database...');
    
    const { data: software, error } = await supabaseAdmin
      .from('software')
      .select('id, name, payment_template_subject, payment_template_body');

    if (error) {
      console.error('❌ Errore nel recupero software:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Software trovati:', software?.length || 0);
    
    const softwareWithTemplates = software?.map(s => ({
      id: s.id,
      name: s.name,
      subject: s.payment_template_subject,
      bodyPreview: s.payment_template_body?.substring(0, 200) + '...',
      hasPaymentLink: s.payment_template_body?.includes('{payment_link}') || false,
      hasHtml: s.payment_template_body?.includes('<html>') || false
    }));

    return NextResponse.json({
      success: true,
      count: software?.length || 0,
      software: softwareWithTemplates,
      message: "Template verificati nel database"
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug template:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
