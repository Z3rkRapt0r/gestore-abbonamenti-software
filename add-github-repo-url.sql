-- Aggiungi colonna github_repo_url alla tabella subscribers
ALTER TABLE subscribers 
ADD COLUMN github_repo_url TEXT;

-- Aggiungi indice per performance
CREATE INDEX IF NOT EXISTS idx_subscribers_github_repo_url ON subscribers(github_repo_url);

-- Commento per documentazione
COMMENT ON COLUMN subscribers.github_repo_url IS 'URL del repository GitHub creato per questo cliente';
