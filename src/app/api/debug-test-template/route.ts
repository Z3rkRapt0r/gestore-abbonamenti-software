import { NextRequest, NextResponse } from "next/server";

// POST /api/debug-test-template - Testa il template con dati di esempio
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 DEBUG: Testando template email...');
    
    const testTemplate = `Ciao {first_name} {last_name},

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

    const testData = {
      first_name: 'Mario',
      last_name: 'Rossi',
      email: 'mario.rossi@example.com',
      project_name: 'Progetto Test',
      software_name: 'Software Test',
      payment_link: 'https://checkout.stripe.com/pay/cs_test_123456789',
      subscription_price: '29.99',
    };

    // Testa la sostituzione delle variabili
    const processedBody = replaceTemplateVariables(testTemplate, testData);
    
    // Testa la generazione HTML
    const htmlPreview = generateEmailPreview(testTemplate, processedBody, testData);

    return NextResponse.json({
      success: true,
      message: "Template testato con successo",
      originalTemplate: testTemplate,
      processedTemplate: processedBody,
      htmlPreview: htmlPreview,
      hasPaymentLink: testTemplate.includes('{payment_link}'),
      testData: testData
    });

  } catch (error: unknown) {
    console.error("❌ Errore nel test template:", error);
    return NextResponse.json({
      success: false,
      error: "Errore interno del server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Funzione helper per sostituire le variabili nel template
function replaceTemplateVariables(template: string, data: any): string {
  const replacements: Record<string, string> = {
    '{first_name}': data.first_name || '',
    '{last_name}': data.last_name || '',
    '{email}': data.email || '',
    '{project_name}': data.project_name || '',
    '{software_name}': data.software_name || '',
    '{payment_link}': data.payment_link || '',
    '{subscription_price}': data.subscription_price || '0',
  };

  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  return result;
}

// Funzione per generare HTML di anteprima
function generateEmailPreview(templateBody: string, processedBody: string, sampleData: any): string {
  // Se il template contiene già HTML completo, usalo direttamente
  if (templateBody.includes('<html>') || templateBody.includes('<!DOCTYPE')) {
    return processedBody;
  }
  
  // Altrimenti, wrappa il testo in HTML con grafica e pulsante
  const htmlBody = processedBody.replace(/\n/g, '<br>');
  
  // Controlla se il template originale contiene {payment_link} per aggiungere il pulsante
  const hasButton = templateBody.includes('{payment_link}');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anteprima Email</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e74c3c;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #e74c3c;
      margin-bottom: 10px;
    }
    .preview-label {
      background: #e3f2fd;
      color: #1976d2;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #e74c3c;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: #c0392b;
    }
    .details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="preview-label">📧 ANTEPRIMA EMAIL</div>
    
    <div class="header">
      <div class="logo">🚀 ${sampleData.software_name}</div>
      <h1>Completa il pagamento</h1>
    </div>

    <div style="white-space: pre-line;">${htmlBody}</div>

    ${hasButton ? `
    <div style="text-align: center;">
      <a href="${sampleData.payment_link}" class="button">
        💳 Completa il Pagamento
      </a>
    </div>
    ` : ''}

    <div class="footer">
      <p>Questo è un messaggio automatico, non rispondere a questa email.</p>
      <p>© 2024 ${sampleData.software_name}</p>
    </div>
  </div>
</body>
</html>
  `;
}
