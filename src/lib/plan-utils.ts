/**
 * Utilidades para el sistema Freemium de Veliora.
 */

export const PLAN_FREE = 'free'
export const PLAN_TRIAL = 'trial'
export const PLAN_PREMIUM = 'premium'
export const PLAN_EXPIRED = 'expired'
export type PlanType = typeof PLAN_FREE | typeof PLAN_TRIAL | typeof PLAN_PREMIUM | typeof PLAN_EXPIRED

// Rutas PREMIUM (bloqueadas en plan gratuito)
export const PREMIUM_ROUTES = [
  '/ingresos/nuevo',
  '/metricas',
  '/salud',
  '/configuracion',
]

// APIs PREMIUM
export const PREMIUM_API_ROUTES = [
  '/api/analyze-business',
  '/api/extract-invoice',
  '/api/whatsapp-alert',
]

/**
 * Verifica si un plan tiene acceso a funciones premium.
 */
export function isPremiumPlan(planType: string | null | undefined): boolean {
  return planType === PLAN_PREMIUM || planType === PLAN_TRIAL
}

/**
 * Verifica si el usuario puede acceder a una ruta según su plan.
 */
export function canAccessRoute(planType: string | null | undefined, pathname: string): boolean {
  if (isPremiumPlan(planType)) return true
  // Free users can access everything except premium routes
  const isPremiumRoute = PREMIUM_ROUTES.some(route => pathname.startsWith(route))
  const isPremiumAPI = PREMIUM_API_ROUTES.some(route => pathname.startsWith(route))
  return !isPremiumRoute && !isPremiumAPI
}

/**
 * Features disponibles en cada plan (para UI).
 */
export const PLAN_FEATURES = {
  [PLAN_FREE]: {
    name: 'Gratis',
    price: '$0',
    badge: 'GRATIS',
    color: 'text-green-400',
    features: [
      'Inventario manual (agregar, editar, eliminar)',
      'Registro de ventas e historial',
      'Registro de gastos',
      'Dashboard básico',
      'Exportar datos',
      '1 dispositivo',
    ],
  },
  [PLAN_PREMIUM]: {
    name: 'Premium',
    price: '$449/mes',
    badge: 'PREMIUM',
    color: 'text-blue-400',
    features: [
      'Todo lo de Gratis +',
      'Escaneo IA de facturas y tickets',
      'Asistente IA de negocios',
      'Alertas WhatsApp automáticas',
      'Dashboard de Salud con semáforo',
      'Métricas avanzadas con gráficas',
      'Código de barras',
      'Multi-dispositivo (hasta 6)',
      'Precio lanzamiento: $199 primer mes',
    ],
  },
  [PLAN_TRIAL]: {
    name: 'Trial',
    price: '7 días gratis',
    badge: 'PRUEBA',
    color: 'text-cyan-400',
    features: [
      'Todo lo de Premium',
      'Sin límite de funciones',
      'Expira en 7 días',
    ],
  },
}
