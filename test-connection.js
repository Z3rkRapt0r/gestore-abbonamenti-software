const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Test connessione Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Test 1: Verifica connessione base
    console.log('\n1️⃣ Test connessione base...');
    const { data, error } = await supabase.from('admins').select('count').limit(1);
    
    if (error) {
      console.error('❌ Errore connessione:', error.message);
      return;
    }
    
    console.log('✅ Connessione riuscita!');
    
    // Test 2: Verifica tabelle esistenti
    console.log('\n2️⃣ Test tabelle esistenti...');
    const tables = ['admins', 'configurations', 'subscribers', 'payments'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Tabella ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabella ${table}: OK`);
      }
    }
    
    // Test 3: Test autenticazione
    console.log('\n3️⃣ Test autenticazione...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Nessuna sessione attiva (normale per test)');
    } else {
      console.log('✅ Sistema di autenticazione funzionante');
    }
    
    console.log('\n🎉 Test completato con successo!');
    console.log('Il progetto è pronto per essere utilizzato.');
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

testConnection();

