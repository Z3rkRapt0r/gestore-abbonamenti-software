-- Fix per impostare i default corretti per i nuovi subscriber
-- Esegui questo script nel SQL Editor di Supabase

-- Aggiorna i default per subscription_status e is_active
ALTER TABLE subscribers 
ALTER COLUMN subscription_status SET DEFAULT 'PENDING';

ALTER TABLE subscribers 
ALTER COLUMN is_active SET DEFAULT false;

-- Verifica i default aggiornati
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
AND column_name IN ('subscription_status', 'is_active');
