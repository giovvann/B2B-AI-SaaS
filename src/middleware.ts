import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PREMIUM_ROUTES = ['/ingresos/nuevo', '/metricas', '/salud', '/configuracion']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'Giovva729@hotmail.com').toLowerCase()
  const isSuperAdmin = user?.email?.toLowerCase() === SUPERADMIN_EMAIL

  // ============================================
  // REGLA: Superadmin — acceso completo
  // ============================================
  if (pathname.startsWith('/superadmin') && !isSuperAdmin) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ============================================
  // REGLA: Rutas públicas
  // ============================================
  const publicRoutes = ['/login', '/registro', '/auth', '/privacidad', '/terminos', '/seguridad', '/suscripcion-expirada']
  const publicApiRoutes = ['/api/extract-invoice', '/api/analyze-business', '/api/whatsapp-alert']
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth'))
  const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))

  if (pathname === '/' || isPublic || isPublicApi) {
    return response
  }

  // ============================================
  // REGLA: No autenticado → login
  // ============================================
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ============================================
  // REGLA: Verificar suscripción y plan
  // ============================================
  if (!isSuperAdmin) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('subscription_expires_at, is_active, plan_type')
      .eq('owner_id', user.id)
      .single()

    if (boutique) {
      const now = new Date()
      const expiresAt = boutique.subscription_expires_at ? new Date(boutique.subscription_expires_at) : null
      const planType = boutique.plan_type || 'free'

      // Si el plan expiró y no es free → redirect a suscripcion-expirada
      const isExpiredPremium = !boutique.is_active && planType !== 'free'
      const isPastTrial = planType === 'trial' && expiresAt && expiresAt < now

      if ((isExpiredPremium || isPastTrial) && pathname !== '/suscripcion-expirada') {
        const url = request.nextUrl.clone()
        url.pathname = '/suscripcion-expirada'
        return NextResponse.redirect(url)
      }

      // Si es plan FREE → bloquear rutas premium
      if (planType === 'free' || (planType === 'trial' && expiresAt && expiresAt < now)) {
        const isPremiumRoute = PREMIUM_ROUTES.some(route => pathname.startsWith(route))
        if (isPremiumRoute) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
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
