-- Crea tabella software per gestire più software dell'admin
CREATE TABLE IF NOT EXISTS software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  github_repo_template TEXT NOT NULL,
  github_token TEXT NOT NULL,
  payment_template_subject TEXT NOT NULL DEFAULT 'Completa il pagamento per {software_name}',
  payment_template_body TEXT NOT NULL DEFAULT 'Ciao {first_name},\n\nPer completare l\'abbonamento a {software_name}, clicca sul link qui sotto:\n\n{payment_link}\n\nCordiali saluti,\nIl team di {software_name}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggiungi colonna software_id alla tabella subscribers
ALTER TABLE subscribers 
ADD COLUMN software_id UUID REFERENCES software(id);

-- Aggiungi indice per performance
CREATE INDEX IF EXISTS idx_subscribers_software_id ON subscribers(software_id);
CREATE INDEX IF EXISTS idx_software_active ON software(is_active);

-- Inserisci software di default (esempio)
INSERT INTO software (name, description, github_repo_template, github_token, payment_template_subject, payment_template_body) 
VALUES (
  'Software Base',
  'Software di default per i clienti',
  'https://github.com/template-repo',
  'ghp_default_token',
  'Completa il pagamento per {software_name}',
  'Ciao {first_name},\n\nPer completare l\'abbonamento a {software_name}, clicca sul link qui sotto:\n\n{payment_link}\n\nCordiali saluti,\nIl team di {software_name}'
);

-- Aggiorna subscribers esistenti con software di default
UPDATE subscribers 
SET software_id = (SELECT id FROM software WHERE name = 'Software Base' LIMIT 1)
WHERE software_id IS NULL;
