import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/debug-update-templates - Aggiorna tutti i template con il nuovo formato
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DEBUG: Aggiornando template software nel database...');
    
    const newTemplateBody = `Ciao {first_name} {last_name},

Il tuo progetto "{project_name}" è stato configurato con successo!

Per attivare il servizio e iniziare a utilizzare la piattaforma, completa il pagamento dell'abbonamento mensile.

Dettagli Abbonamento:
• Progetto: {project_name}
• Prezzo: €{subscription_price}/mese
• Fatturazione: Mensile
• Pagamento: Carta di credito/debito

Clicca sul pulsante qui sotto per completare il pagamento:

{payment_link}

Importante: Il link di pagamento è valido per 24 ore. Dopo questo periodo, dovrai richiedere un nuovo link.

Se hai domande o hai bisogno di assistenza, non esitare a contattarci.

Cordiali saluti,
Il team di {software_name}`;

    const { data: updatedSoftware, error } = await supabaseAdmin
      .from('software')
      .update({
        payment_template_subject: 'Completa il pagamento per {software_name}',
        payment_template_body: newTemplateBody
      })
      .select('id, name, payment_template_subject');

    if (error) {
      console.error('❌ Errore nell\'aggiornamento:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Template aggiornati:', updatedSoftware?.length || 0);

    return NextResponse.json({
      success: true,
      message: "Template aggiornati con successo",
      updatedCount: updatedSoftware?.length || 0,
      updatedSoftware: updatedSoftware?.map(s => ({
        id: s.id,
        name: s.name,
        subject: s.payment_template_subject
      })),
      templateIncludesPaymentLink: newTemplateBody.includes('{payment_link}')
    });

  } catch (error: unknown) {
    console.error("❌ Errore nell'aggiornamento template:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
