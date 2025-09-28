// Server-side authentication con Supabase
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // Assicura che i cookie funzionino su Vercel
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                httpOnly: false, // Permette accesso client-side
              })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Funzione per verificare se l'utente è autenticato
export async function requireAuth() {
  try {
    const user = await getServerUser()
    if (!user) {
      console.log('❌ Utente non autenticato')
      throw new Error('Non autorizzato')
    }
    console.log('✅ Utente autenticato:', user.email)
    return user
  } catch (error) {
    console.log('❌ Errore autenticazione:', error)
    throw new Error('Non autorizzato')
  }
}

