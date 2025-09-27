-- Aggiungi colonna subscription_type alla tabella subscribers
ALTER TABLE subscribers 
ADD COLUMN subscription_type TEXT DEFAULT 'monthly';

-- Aggiorna i subscriber esistenti con tipo mensile
UPDATE subscribers 
SET subscription_type = 'monthly' 
WHERE subscription_type IS NULL;
