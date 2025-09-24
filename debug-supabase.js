// Debug connessione Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlfyefwoyadqypbshbgr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZnllZndveWFkcXlwYnNoYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzkzNDQsImV4cCI6MjA3NDE1NTM0NH0.Uk-oDngMU71urM57s2Dgn5r45Vlzo-eLMGjGsdR7Iz8'

console.log('🔍 Debug connessione Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugConnection() {
  try {
    console.log('\n1. Test connessione base...')
    
    // Test 1: Verifica se Supabase risponde
    const { data: health, error: healthError } = await supabase
      .from('_health')
      .select('*')
      .limit(1)
    
    if (healthError) {
      console.log('❌ Errore health check:', healthError.message)
    } else {
      console.log('✅ Health check OK')
    }
    
    console.log('\n2. Test tabella admins...')
    
    // Test 2: Verifica tabella admins
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .limit(1)
    
    if (adminsError) {
      console.log('❌ Errore tabella admins:', adminsError.message)
      console.log('💡 La tabella potrebbe non esistere o non essere accessibile')
    } else {
      console.log('✅ Tabella admins OK')
      console.log('📊 Dati:', admins)
    }
    
    console.log('\n3. Test autenticazione...')
    
    // Test 3: Verifica autenticazione
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.log('❌ Errore autenticazione:', authError.message)
    } else {
      console.log('✅ Autenticazione OK')
      console.log('👤 Utente:', auth.user?.email)
    }
    
  } catch (err) {
    console.log('❌ Errore generale:', err.message)
    console.log('Stack:', err.stack)
  }
}

debugConnection()


