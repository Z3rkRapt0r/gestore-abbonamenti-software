const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdmin() {
  console.log('🔍 Test utente admin...');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Test 1: Verifica utenti admin nel database
    console.log('\n1️⃣ Verifica utenti admin nel database...');
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('*');
    
    if (adminError) {
      console.error('❌ Errore nel recupero admin:', adminError.message);
      return;
    }
    
    console.log('✅ Admin trovati:', admins.length);
    admins.forEach(admin => {
      console.log(`  - Email: ${admin.email}`);
      console.log(`  - ID: ${admin.id}`);
      console.log(`  - Creato: ${admin.created_at}`);
    });
    
    // Test 2: Test autenticazione con email/password
    console.log('\n2️⃣ Test autenticazione...');
    const testEmail = 'admin@example.com';
    const testPassword = 'admin123';
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('❌ Errore autenticazione:', authError.message);
      console.log('💡 Suggerimenti:');
      console.log('  1. Verifica che l\'utente sia stato creato in Supabase Auth');
      console.log('  2. Controlla che l\'email e password siano corrette');
      console.log('  3. Assicurati che l\'utente sia confermato');
    } else {
      console.log('✅ Autenticazione riuscita!');
      console.log('   User ID:', authData.user.id);
      console.log('   Email:', authData.user.email);
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

testAdmin();

