const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseAdmin() {
  console.log('🔍 Test Supabase Admin...');
  
  try {
    const testData = {
      first_name: 'Test Admin',
      last_name: 'User',
      email: 'test-admin@example.com',
      project_name: 'Test Admin Project',
      github_repo_template: 'test-template',
      client_slug: 'test-admin-project',
      vercel_token: 'test-token',
      subscription_price: 29.99,
      subscription_status: 'ACTIVE',
      is_active: true,
    };

    console.log('📝 Dati di test:', testData);

    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Errore inserimento:', error);
      console.log('💡 Messaggio errore:', error.message);
      console.log('💡 Codice errore:', error.code);
      console.log('💡 Dettagli errore:', error.details);
    } else {
      console.log('✅ Inserimento riuscito:', data);
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  }
}

testSupabaseAdmin();

