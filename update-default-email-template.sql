-- Aggiorna il template email di default per tutti i software
-- Usa il template più completo che era hardcoded come base
-- INCLUDE IL PULSANTE HTML E LA GRAFICA

UPDATE software 
SET payment_template_subject = 'Completa il pagamento per {software_name}',
    payment_template_body = 'Ciao {first_name} {last_name},

Il tuo progetto "{project_name}" è stato configurato con successo!

Per attivare il servizio e iniziare a utilizzare la piattaforma, completa il pagamento dell''abbonamento mensile.

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
Il team di {software_name}'
WHERE payment_template_body LIKE '%Ciao {first_name},%' 
   OR payment_template_body LIKE '%Per completare l''abbonamento%';

-- Verifica l'aggiornamento
SELECT id, name, payment_template_subject, LEFT(payment_template_body, 100) as template_preview
FROM software;
