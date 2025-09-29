import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: false,
            })
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Consenti SEMPRE il webhook Stripe (niente auth / cookie handling)
  if (request.nextUrl.pathname === '/api/stripe/webhook') {
    return NextResponse.next()
  }

  // Proteggi le route API che richiedono autenticazione
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/debug-') &&
      !request.nextUrl.pathname.startsWith('/api/test') &&
      !request.nextUrl.pathname.startsWith('/api/force-login') && // Escluso per login
      !request.nextUrl.pathname.startsWith('/api/auth/') && // Escluso per autenticazione
      !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  // Proteggi le route dell'app che richiedono autenticazione
  if ((request.nextUrl.pathname.startsWith('/dashboard') ||
       request.nextUrl.pathname.startsWith('/software') ||
       request.nextUrl.pathname.startsWith('/subscribers')) && 
      !user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Permetti accesso alla pagina di login anche se non autenticato
  if (request.nextUrl.pathname.startsWith('/auth/signin') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
