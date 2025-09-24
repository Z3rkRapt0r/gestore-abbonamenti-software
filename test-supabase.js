// Test connessione Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nlfyefwoyadqypbshbgr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZnllZndveWFkcXlwYnNoYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzkzNDQsImV4cCI6MjA3NDE1NTM0NH0.Uk-oDngMU71urM57s2Dgn5r45Vlzo-eLMGjGsdR7Iz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testando connessione Supabase...')
  
  try {
    // Test 1: Verifica connessione base
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Errore connessione:', error.message)
      console.log('💡 Probabilmente le tabelle non sono state create')
      return false
    }
    
    console.log('✅ Connessione Supabase OK!')
    console.log('📊 Dati ricevuti:', data)
    return true
    
  } catch (err) {
    console.log('❌ Errore:', err.message)
    return false
  }
}

testConnection()


