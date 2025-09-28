-- Fix RLS policies per tabella software
-- Abilita RLS sulla tabella software
ALTER TABLE software ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "Enable all operations for public" ON software;

-- Crea policy per permettere tutte le operazioni (per admin)
CREATE POLICY "Enable all operations for public" ON software
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Verifica che RLS sia abilitato
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'software';
