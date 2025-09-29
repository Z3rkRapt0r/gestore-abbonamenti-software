import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/debug-template-content - Mostra il contenuto esatto del template
export async function GET() {
  try {
    console.log('🔍 DEBUG: Controllando contenuto esatto del template...');
    
    const { data: software, error } = await supabaseAdmin
      .from('software')
      .select('id, name, payment_template_body');

    if (error) {
      console.error('❌ Errore nel recupero software:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    const softwareWithDetails = software?.map(s => ({
      id: s.id,
      name: s.name,
      templateBody: s.payment_template_body,
      templateLength: s.payment_template_body?.length || 0,
      containsPaymentLink: s.payment_template_body?.includes('{payment_link}') || false,
      containsPaymentLinkSpaces: s.payment_template_body?.includes('{ payment_link }') || false,
      containsPaymentLinkVariations: [
        s.payment_template_body?.includes('{payment_link}'),
        s.payment_template_body?.includes('{ payment_link }'),
        s.payment_template_body?.includes('{payment_link }'),
        s.payment_template_body?.includes('{ payment_link}')
      ],
      templatePreview: s.payment_template_body?.substring(0, 500) + '...'
    }));

    return NextResponse.json({
      success: true,
      count: software?.length || 0,
      software: softwareWithDetails,
      message: "Contenuto template verificato"
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel debug template content:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
