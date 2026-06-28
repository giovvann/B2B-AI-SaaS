import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  
  // Email del superadmin (case-insensitive)
  const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'Giovva729@hotmail.com').toLowerCase()
  
  // Verificar si el usuario actual es superadmin
  const isSuperAdmin = user?.email?.toLowerCase() === SUPERADMIN_EMAIL

  // ============================================
  // REGLA 1: /superadmin - Solo el superadmin
  // ============================================
  if (pathname.startsWith('/superadmin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (!isSuperAdmin) {
      // Si no es superadmin, redirigir a home
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    // Superadmin tiene acceso total
    return response
  }

  // ============================================
  // REGLA 2: /suscripcion-expirada - Pública para usuarios logueados
  // ============================================
  if (pathname === '/suscripcion-expirada') {
    return response
  }

  // ============================================
  // REGLA 3: Rutas públicas (no requieren auth)
  // ============================================
  const publicRoutes = ['/', '/login', '/auth']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/auth'))) {
    return response
  }

  // ============================================
  // REGLA 4: Rutas API públicas
  // ============================================
  if (pathname.startsWith('/api/extract-invoice') || 
      pathname.startsWith('/api/analyze-business')) {
    return response
  }

  // ============================================
  // REGLA 5: Rutas protegidas (requieren auth)
  // ============================================
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ============================================
  // REGLA 6: Verificar suscripción (excepto superadmin)
  // ============================================
  if (!isSuperAdmin) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('subscription_expires_at, is_active')
      .eq('owner_id', user.id)
      .single()

    if (boutique) {
      const now = new Date()
      const expiresAt = boutique.subscription_expires_at ? new Date(boutique.subscription_expires_at) : null
      const isExpired = !boutique.is_active || (expiresAt && expiresAt < now)

      const protectedRoutes = ['/ingresos', '/ventas', '/metricas']
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

      if (isExpired && isProtectedRoute && pathname !== '/suscripcion-expirada') {
        const url = request.nextUrl.clone()
        url.pathname = '/suscripcion-expirada'
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}