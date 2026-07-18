import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para el sistema de alertas WhatsApp.
 * 
 * GET /api/whatsapp-alert — Consultado por el worker para obtener alertas pendientes
 * POST /api/whatsapp-alert — Enviar una alerta manual (test o notificación directa)
 */

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 horas
const alertCache = new Map<string, { sentAt: number; hash: string }>()

function hashAlert(type: string, boutiqueId: string, products: string): string {
  return `${type}:${boutiqueId}:${products}`
}

// ============================================================
// GET — El worker consulta alertas pendientes para todas las boutiques
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const authHeader = request.headers.get('authorization')
    const secret = process.env.VELIORA_WA_SECRET
    const isAuthenticated = !!user || (secret && authHeader === `Bearer ${secret}`)

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: boutiques } = await supabase
      .from('boutiques')
      .select(`
        id, name, owner_id,
        subscription_expires_at, is_active,
        whatsapp_alerts_enabled
      `)
      .eq('is_active', true)

    if (!boutiques || boutiques.length === 0) {
      return NextResponse.json({ alerts: [] })
    }

    const alerts: any[] = []
    const nowMs = Date.now()

    for (const boutique of boutiques) {
      const expiresAt = boutique.subscription_expires_at ? new Date(boutique.subscription_expires_at) : null
      const isPremium = boutique.is_active && (!expiresAt || expiresAt > new Date()) && boutique.whatsapp_alerts_enabled !== false
      if (!isPremium) continue

      const { data: inventory } = await supabase
        .from('products')
        .select('id, name, stock, sale_price, purchase_price')
        .eq('boutique_id', boutique.id)

      if (!inventory || inventory.length === 0) continue

      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { data: sales } = await supabase
        .from('sales')
        .select('id, created_at, sale_items(product_id)')
        .eq('boutique_id', boutique.id)
        .gte('created_at', ninetyDaysAgo.toISOString())

      const lastSold: Record<string, number> = {}
      sales?.forEach((sale: any) => {
        const t = new Date(sale.created_at).getTime()
        sale.sale_items?.forEach((item: any) => {
          if (!lastSold[item.product_id] || t > lastSold[item.product_id]) {
            lastSold[item.product_id] = t
          }
        })
      })

      // ALERTA: Stock crítico (≤3 unidades)
      const criticalItems = inventory.filter((p: any) => (p.stock || 0) <= 3 && (p.stock || 0) > 0)
      if (criticalItems.length > 0) {
        const alertProducts = criticalItems.map((p: any) => ({ name: p.name, stock: p.stock }))
        const h = hashAlert('critical', boutique.id, alertProducts.map(p => p.name).join(','))
        const cached = alertCache.get(h)
        if (!cached || (nowMs - cached.sentAt) > CACHE_TTL) {
          alerts.push({ type: 'critical_stock', boutique: boutique.name, data: { products: alertProducts } })
          alertCache.set(h, { sentAt: nowMs, hash: h })
        }
      }

      // ALERTA: Dead stock (30+ días sin vender)
      const deadItems = inventory.filter((p: any) => {
        const last = lastSold[p.id]
        if (!last) return (p.stock || 0) > 0
        return (nowMs - last) > THIRTY_DAYS && (p.stock || 0) > 0
      })

      if (deadItems.length > 0) {
        const topDead = deadItems.slice(0, 5).map((p: any) => ({
          name: p.name, stock: p.stock, value: (p.sale_price || 0) * (p.stock || 0)
        }))
        const totalDeadValue = topDead.reduce((s: number, p: any) => s + p.value, 0)
        const suggestion = totalDeadValue > 5000
          ? 'Capital alto congelado. Considera descuento por lotes o promoción 2x1.'
          : 'Ofrece descuento del 20-30% para liberar capital.'
        alerts.push({ type: 'dead_stock', boutique: boutique.name, data: { products: topDead, totalValue: totalDeadValue, suggestion } })
      }

      // Resumen semanal (solo domingos)
      if (new Date().getDay() === 0 && criticalItems.length === 0 && deadItems.length === 0) {
        alerts.push({
          type: 'weekly_summary',
          boutique: boutique.name,
          data: { summary: `Todo en orden en ${boutique.name}. ${inventory.length} productos en inventario. Sin alertas.` }
        })
      }
    }

    return NextResponse.json({ alerts, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Error generando alertas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ============================================================
// POST — Enviar alerta manual (test o notificación directa)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener boutique del usuario
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('id, name, whatsapp_number')
      .eq('owner_id', user.id)
      .single()

    if (!boutique) {
      return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { type, data } = body

    let message = ''
    switch (type) {
      case 'test':
        message = data?.message || '🔔 Mensaje de prueba desde Veliora.'
        break
      case 'critical_stock':
        message = `⚠️ *STOCK CRÍTICO* - ${boutique.name}\n\nRevisa el dashboard para más detalles.`
        break
      default:
        message = data?.message || `📢 Notificación de ${boutique.name}`
    }

    // Guardar en el log
    await supabase.from('whatsapp_alerts_log').insert({
      boutique_id: boutique.id,
      alert_type: type || 'test',
      message,
      status: 'pending',
    })

    // Intentar enviar al worker (si está disponible)
    const workerUrl = process.env.WHATSAPP_WORKER_URL
    let workerSent = false
    if (workerUrl && boutique.whatsapp_number) {
      try {
        const waRes = await fetch(`${workerUrl}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: boutique.whatsapp_number,
            text: message,
          }),
        })
        workerSent = waRes.ok
      } catch (e) {
        console.error('Worker unreachable:', e)
      }
    }

    // Actualizar status
    await supabase
      .from('whatsapp_alerts_log')
      .update({ status: workerSent ? 'sent' : 'pending' })
      .eq('boutique_id', boutique.id)
      .eq('status', 'pending')

    return NextResponse.json({
      success: true,
      workerReachable: workerSent,
      message: workerSent
        ? 'Alerta enviada al WhatsApp worker'
        : 'Alerta guardada (worker no disponible)',
    })
  } catch (error) {
    console.error('Error enviando alerta:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
