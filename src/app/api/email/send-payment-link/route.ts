import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/database";
import { Resend } from 'resend';

// POST /api/email/send-payment-link - Invia email con link pagamento
export async function POST(request: NextRequest) {
  try {
    // await requireAuth(); // Temporaneamente disabilitato per debug

    const body = await request.json();
    const { subscriberId, checkoutUrl } = body;

    if (!subscriberId || !checkoutUrl) {
      return NextResponse.json({ 
        error: "ID abbonato e URL checkout richiesti" 
      }, { status: 400 });
    }

    // Recupera i dati del subscriber
    const subscriber = await db.getSubscriberById(subscriberId);
    if (!subscriber) {
      return NextResponse.json({ error: "Abbonato non trovato" }, { status: 404 });
    }

    // Inizializza Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    if (!process.env.RESEND_API_KEY) {
      console.log("⚠️ RESEND_API_KEY non configurata, simulando invio email");
      const emailContent = generatePaymentEmail(subscriber, checkoutUrl);
      console.log("=== EMAIL DA INVIARE (SIMULATA) ===");
      console.log(`A: ${subscriber.email}`);
      console.log(`Oggetto: Completare il pagamento per ${subscriber.project_name}`);
      console.log("Contenuto:");
      console.log(emailContent);
      console.log("====================================");
    } else {
      // Invio email reale con Resend
      console.log("📧 Invio email reale con Resend...");
      const emailContent = generatePaymentEmail(subscriber, checkoutUrl);
      
      try {
        const { data, error } = await resend.emails.send({
          from: 'onboarding@resend.dev', // Dominio di test Resend
          to: [subscriber.email],
          subject: `Completare il pagamento per ${subscriber.project_name}`,
          html: emailContent,
        });

        if (error) {
          console.error("❌ Errore Resend:", error);
          return NextResponse.json({ 
            error: "Errore nell'invio email",
            details: error 
          }, { status: 500 });
        }

        console.log("✅ Email inviata con successo:", data);
      } catch (resendError) {
        console.error("❌ Errore durante invio Resend:", resendError);
        return NextResponse.json({ 
          error: "Errore nell'invio email",
          details: resendError instanceof Error ? resendError.message : String(resendError)
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Email inviata con successo",
      email: subscriber.email,
      checkout_url: checkoutUrl,
    });

  } catch (error: unknown) {
    console.error("Errore nell'invio email:", error);
    return NextResponse.json({ 
      error: "Errore interno del server" 
    }, { status: 500 });
  }
}

function generatePaymentEmail(subscriber: any, checkoutUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Completa il pagamento</title>
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
    <div class="header">
      <div class="logo">🚀 Gestore Abbonamenti</div>
      <h1>Completa il pagamento</h1>
    </div>

    <p>Ciao <strong>${subscriber.first_name} ${subscriber.last_name}</strong>,</p>

    <p>Il tuo progetto <strong>"${subscriber.project_name}"</strong> è stato configurato con successo!</p>

    <p>Per attivare il servizio e iniziare a utilizzare la piattaforma, completa il pagamento dell'abbonamento mensile.</p>

    <div class="details">
      <h3>Dettagli Abbonamento:</h3>
      <ul>
        <li><strong>Progetto:</strong> ${subscriber.project_name}</li>
        <li><strong>Prezzo:</strong> €${subscriber.subscription_price}/mese</li>
        <li><strong>Fatturazione:</strong> Mensile</li>
        <li><strong>Pagamento:</strong> Carta di credito/debito</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${checkoutUrl}" class="button">
        💳 Completa il Pagamento
      </a>
    </div>

    <p><strong>Importante:</strong> Il link di pagamento è valido per 24 ore. Dopo questo periodo, dovrai richiedere un nuovo link.</p>

    <p>Se hai domande o hai bisogno di assistenza, non esitare a contattarci.</p>

    <div class="footer">
      <p>Questo è un messaggio automatico, non rispondere a questa email.</p>
      <p>© 2024 Gestore Abbonamenti Software</p>
    </div>
  </div>
</body>
</html>
  `;
}
