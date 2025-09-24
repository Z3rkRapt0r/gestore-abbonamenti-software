// Supabase Client per operazioni server-side
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client Supabase per operazioni server-side (usa anon key per ora)
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)

// Client normale per operazioni client-side
export { supabase } from './supabase'

