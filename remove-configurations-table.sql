-- Rimuovi tabella configurations (ora inutile con sistema multi-software)
-- I dati sono stati spostati nella tabella software

-- Prima rimuovi le foreign key se esistono
ALTER TABLE configurations DROP CONSTRAINT IF EXISTS configurations_pkey;

-- Rimuovi la tabella configurations
DROP TABLE IF EXISTS configurations;

-- Verifica che la tabella sia stata rimossa
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'configurations';
