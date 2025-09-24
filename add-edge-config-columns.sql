-- Migrazione per aggiungere colonne Edge Config alla tabella subscribers
-- Esegui questo script nel SQL Editor di Supabase

-- Aggiungi colonne edge_config_id e edge_key alla tabella subscribers
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS edge_config_id TEXT,
ADD COLUMN IF NOT EXISTS edge_key TEXT DEFAULT 'maintenance';

-- Aggiungi commenti per documentare le colonne
COMMENT ON COLUMN subscribers.edge_config_id IS 'ID Edge Config Vercel per gestione manutenzione 1-click (formato: ecfg_xxxxxxxxxxxxxxxxxxxxx)';
COMMENT ON COLUMN subscribers.edge_key IS 'Chiave Edge Config per il valore di manutenzione (default: maintenance)';

-- Verifica che le colonne siano state aggiunte
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
AND column_name IN ('edge_config_id', 'edge_key');
