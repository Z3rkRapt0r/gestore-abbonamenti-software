-- Rimuovi colonna github_repo_template dalla tabella subscribers
-- Questa colonna è stata sostituita dal sistema multi-software

-- Prima rimuovi il constraint NOT NULL se esiste
ALTER TABLE subscribers 
ALTER COLUMN github_repo_template DROP NOT NULL;

-- Poi rimuovi la colonna completamente
ALTER TABLE subscribers 
DROP COLUMN IF EXISTS github_repo_template;

-- Commento per documentazione
COMMENT ON TABLE subscribers IS 'Tabella subscribers aggiornata per sistema multi-software - github_repo_template rimosso';
