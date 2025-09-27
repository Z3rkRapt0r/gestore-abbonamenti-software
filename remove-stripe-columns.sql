-- Rimuovi colonne Stripe inutili dalla tabella configurations
-- Queste colonne non vengono mai usate (Stripe usa solo variabili d'ambiente)

-- Rimuovi colonna stripe_secret_key
ALTER TABLE configurations 
DROP COLUMN IF EXISTS stripe_secret_key;

-- Rimuovi colonna stripe_webhook_secret  
ALTER TABLE configurations 
DROP COLUMN IF EXISTS stripe_webhook_secret;

-- Verifica che le colonne siano state rimosse
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'configurations' 
ORDER BY ordinal_position;
