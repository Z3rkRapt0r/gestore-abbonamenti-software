-- Fix RLS policies per dare pieno controllo agli admin
-- Esegui questi comandi nel SQL Editor di Supabase

-- 1. Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "Admin full control subscribers" ON subscribers;
DROP POLICY IF EXISTS "Admin full control admins" ON admins;
DROP POLICY IF EXISTS "Admin full control configurations" ON configurations;
DROP POLICY IF EXISTS "Admin full control payments" ON payments;

-- 2. Abilita RLS su tutte le tabelle
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 3. Crea policy per dare PIENO CONTROLLO agli admin
-- Permette SELECT, INSERT, UPDATE, DELETE senza restrizioni

-- Policy per subscribers - PIENO CONTROLLO ADMIN
CREATE POLICY "Admin full control subscribers" ON subscribers
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Policy per admins - PIENO CONTROLLO ADMIN
CREATE POLICY "Admin full control admins" ON admins
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Policy per configurations - PIENO CONTROLLO ADMIN
CREATE POLICY "Admin full control configurations" ON configurations
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Policy per payments - PIENO CONTROLLO ADMIN
CREATE POLICY "Admin full control payments" ON payments
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
