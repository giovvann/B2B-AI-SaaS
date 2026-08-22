import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en .env.local. Cópiala de Supabase Dashboard > Settings > API')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // ROOT CAUSE del bug del cron: Next.js 14 metió al Data Cache las llamadas
    // fetch de supabase-js (URL constante = cacheable). La query de productos
    // del cron devolvía una respuesta vieja cacheada en Vercel (veía 1 de 5
    // productos y nunca creaba las alertas de stock), mientras la query de
    // ventas —con timestamp en la URL— jamás cacheaba igual y por eso el
    // récord sí se creaba. cache:'no-store' en TODAS las queries del admin.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  })
}
