-- Fix RLS policies per permettere agli admin di creare subscriber
-- Esegui questi comandi nel SQL Editor di Supabase

-- 1. Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "Allow all operations for subscribers" ON subscribers;
DROP POLICY IF EXISTS "Allow all operations for admins" ON admins;
DROP POLICY IF EXISTS "Allow all operations for configurations" ON configurations;
DROP POLICY IF EXISTS "Allow all operations for payments" ON payments;

-- 2. Abilita RLS su tutte le tabelle
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 3. Crea policy per permettere tutte le operazioni agli admin
-- (Usa 'public' invece di 'authenticated' per permettere operazioni senza autenticazione)

-- Policy per subscribers
CREATE POLICY "Allow all operations for subscribers" ON subscribers
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Policy per admins
CREATE POLICY "Allow all operations for admins" ON admins
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Policy per configurations
CREATE POLICY "Allow all operations for configurations" ON configurations
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Policy per payments
CREATE POLICY "Allow all operations for payments" ON payments
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Verifica le policy create
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('subscribers', 'admins', 'configurations', 'payments');

-- 5. Verifica che RLS sia abilitato
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('subscribers', 'admins', 'configurations', 'payments');
