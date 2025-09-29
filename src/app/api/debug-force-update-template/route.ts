import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/debug-force-update-template - Forza l'aggiornamento del template
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DEBUG: Forzando aggiornamento template...');
    
    const correctTemplate = `Ciao {first_name} {last_name},

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

    // Aggiorna TUTTI i software con il template corretto
    const { data: updatedSoftware, error } = await supabaseAdmin
      .from('software')
      .update({
        payment_template_subject: 'Completa il pagamento per {software_name}',
        payment_template_body: correctTemplate
      })
      .select('id, name');

    if (error) {
      console.error('❌ Errore nell\'aggiornamento:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Template forzato aggiornato per:', updatedSoftware?.length || 0, 'software');

    return NextResponse.json({
      success: true,
      message: "Template forzato aggiornato con successo",
      updatedCount: updatedSoftware?.length || 0,
      updatedSoftware: updatedSoftware?.map(s => ({
        id: s.id,
        name: s.name
      })),
      templateIncludesPaymentLink: correctTemplate.includes('{payment_link}'),
      templateLength: correctTemplate.length
    });

  } catch (error: unknown) {
    console.error("❌ Errore nell'aggiornamento forzato:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
