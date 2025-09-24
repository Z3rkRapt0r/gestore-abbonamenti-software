// Test autenticazione Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlfyefwoyadqypbshbgr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZnllZndveWFkcXlwYnNoYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzkzNDQsImV4cCI6MjA3NDE1NTM0NH0.Uk-oDngMU71urM57s2Dgn5r45Vlzo-eLMGjGsdR7Iz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🔐 Testando autenticazione Supabase...')
  
  try {
    // Test login con admin di default
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    })
    
    if (error) {
      console.log('❌ Errore login:', error.message)
      return false
    }
    
    console.log('✅ Login riuscito!')
    console.log('👤 Utente:', data.user?.email)
    return true
    
  } catch (err) {
    console.log('❌ Errore:', err.message)
    return false
  }
}

testAuth()


