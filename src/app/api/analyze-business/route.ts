import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { displaySize, displayColor } from '@/lib/product-utils'

const MODEL = 'gemini-2.5-flash'
const MAX_QUESTIONS_PER_MINUTE = 3
const RATE_WINDOW_MS = 60_000
const CLEANUP_INTERVAL = 5 * 60 * 1000

const userRequestMap = new Map<string, { count: number; firstRequest: number }>()

setInterval(() => {
  const cutoff = Date.now() - 120000
  for (const [key, val] of userRequestMap) {
    if (val.firstRequest < cutoff) userRequestMap.delete(key)
  }
}, CLEANUP_INTERVAL)

export async function POST(request: NextRequest) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    const { question } = body
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Pregunta requerida' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Rate limit: 3 preguntas por minuto
    const now = Date.now()
    const userId = user.id
    const userRequests = userRequestMap.get(userId) || { count: 0, firstRequest: now }

    if (now - userRequests.firstRequest > RATE_WINDOW_MS) {
      userRequestMap.set(userId, { count: 1, firstRequest: now })
    } else {
      if (userRequests.count >= MAX_QUESTIONS_PER_MINUTE) {
        const secondsLeft = Math.ceil((RATE_WINDOW_MS - (now - userRequests.firstRequest)) / 1000)
        return NextResponse.json(
          {
            error: `Has usado tus 3 preguntas del minuto. Espera ${secondsLeft} segundos.`,
            retryAfter: secondsLeft,
            type: 'rate_limit'
          },
          { status: 429 }
        )
      }
      userRequests.count++
      userRequestMap.set(userId, userRequests)
    }

    // Cargar boutique
    const { data: boutique, error: boutiqueError } = await supabase
      .from('boutiques').select('id, name').eq('owner_id', user.id).single()
    if (boutiqueError || !boutique) {
      return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })
    }

    // Cargar ventas de los últimos 90 días
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`id, total_amount, created_at, payment_method, sale_items (quantity, price_at_sale, cost_at_sale, products (name, brand, season, purchase_price, sale_price))`)
      .eq('boutique_id', boutique.id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(200)

    if (salesError) {
      return NextResponse.json({ error: 'Error cargando ventas' }, { status: 500 })
    }

    // Gastos del período
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category')
      .eq('boutique_id', boutique.id)
      .gte('expense_date', ninetyDaysAgo.toISOString())

    const totalGastos = expenses?.reduce((sum, e: any) => sum + (e.amount || 0), 0) || 0
    const totalVentas = sales?.reduce((sum, s: any) => sum + (s.total_amount || 0), 0) || 0
    const totalTransacciones = sales?.length || 0

    // Procesar métricas de productos
    const productMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {}
    const brandMap: Record<string, { name: string; revenue: number; profit: number }> = {}
    const sizeMap: Record<string, number> = {}
    const colorMap: Record<string, number> = {}
    const paymentMethods: Record<string, number> = {}

    sales?.forEach((sale: any) => {
      const method = sale.payment_method || 'Desconocido'
      paymentMethods[method] = (paymentMethods[method] || 0) + (sale.total_amount || 0)

      sale.sale_items?.forEach((item: any) => {
        const product = item.products
        if (!product) return

        if (!productMap[product.name]) {
          productMap[product.name] = { name: product.name, quantity: 0, revenue: 0, profit: 0 }
        }
        productMap[product.name].quantity += item.quantity || 0
        productMap[product.name].revenue += (item.price_at_sale || 0) * (item.quantity || 0)
        productMap[product.name].profit += ((item.price_at_sale || 0) - (item.cost_at_sale || 0)) * (item.quantity || 0)

        const brand = product.brand || 'Sin marca'
        if (!brandMap[brand]) brandMap[brand] = { name: brand, revenue: 0, profit: 0 }
        brandMap[brand].revenue += (item.price_at_sale || 0) * (item.quantity || 0)
        brandMap[brand].profit += ((item.price_at_sale || 0) - (item.cost_at_sale || 0)) * (item.quantity || 0)

        const size = displaySize(product.size) || 'N/A'
        sizeMap[size] = (sizeMap[size] || 0) + (item.quantity || 0)
        const color = displayColor(product.color) || 'N/A'
        colorMap[color] = (colorMap[color] || 0) + (item.quantity || 0)
      })
    })

    const topProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10)
    const masRentables = Object.values(productMap).sort((a, b) => b.profit - a.profit).slice(0, 5)
    const topBrands = Object.entries(brandMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)
    const topSizes = Object.entries(sizeMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topColors = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Cargar inventario para alertas
    const { data: inventory } = await supabase
      .from('products')
      .select('id, name, stock, sale_price, size, color, brand, purchase_price')
      .eq('boutique_id', boutique.id)

    const nowMs = Date.now()
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
    const lastSold: Record<string, number> = {}
    sales?.forEach((sale: any) => {
      const t = new Date(sale.created_at).getTime()
      sale.sale_items?.forEach((item: any) => {
        if (!lastSold[item.product_id] || t > lastSold[item.product_id]) {
          lastSold[item.product_id] = t
        }
      })
    })

    // Valor total del inventario
    const valorInventarioTotal = (inventory || []).reduce((sum: number, p: any) => sum + ((p.purchase_price || 0) * (p.stock || 0)), 0)
    const valorInventarioVenta = (inventory || []).reduce((sum: number, p: any) => sum + ((p.sale_price || 0) * (p.stock || 0)), 0)

    const criticalStock = (inventory || []).filter((p: any) => (p.stock || 0) <= 3).map((p: any) => `${p.name} (${p.stock || 0})`)
    const deadStock = (inventory || []).filter((p: any) => {
      const last = lastSold[p.id]
      if (!last) return (p.stock || 0) > 0
      return (nowMs - last) > THIRTY_DAYS && (p.stock || 0) > 0
    }).map((p: any) => `${p.name} (${p.stock || 0}, $${((p.sale_price || 0) * (p.stock || 0)).toFixed(0)} congelados)`)
    const deadValue = deadStock.reduce((sum: number, s: string) => {
      const match = s.match(/\$([0-9.]+) congelados/)
      return sum + (match ? parseFloat(match[1]) : 0)
    }, 0)

    const profitNeto = totalVentas - totalGastos
    const margen = totalVentas > 0 ? ((profitNeto / totalVentas) * 100).toFixed(1) : '0'

    const dataSummary = `BOUTIQUE: ${boutique.name}
PERÍODO: Últimos 90 días
VENTAS: ${totalTransacciones} transacciones, $${totalVentas.toFixed(2)} MXN total
GASTOS: $${totalGastos.toFixed(2)} MXN
PROFIT NETO: $${profitNeto.toFixed(2)} MXN (margen ${margen}%)
TICKET PROMEDIO: $${totalTransacciones > 0 ? (totalVentas / totalTransacciones).toFixed(2) : '0'}
TOP VENDIDOS: ${topProducts.map((p, i) => `${i+1}. ${p.name} (${p.quantity}uds, $${p.revenue.toFixed(0)} ing, $${p.profit.toFixed(0)} gan)`).join(' | ')}
TOP RENTABLES: ${masRentables.map((p, i) => `${i+1}. ${p.name} ($${p.profit.toFixed(0)} gan)`).join(' | ')}
TOP MARCAS: ${topBrands.map(([n, b]) => `${n} ($${b.revenue.toFixed(0)} ing)`).join(' | ')}
TOP TALLAS: ${topSizes.map(([n, q]) => `${n}: ${q}uds`).join(', ')}
TOP COLORES: ${topColors.map(([n, q]) => `${n}: ${q}uds`).join(', ')}
MÉTODOS PAGO: ${Object.entries(paymentMethods).map(([m, a]) => `${m}: $${a.toFixed(0)}`).join(' | ')}
VALOR INVENTARIO: $${valorInventarioTotal.toFixed(0)} (costo) / $${valorInventarioVenta.toFixed(0)} (venta)
ALERTAS INVENTARIO:
  - Stock crítico (≤3 uds): ${criticalStock.length > 0 ? criticalStock.slice(0, 10).join(', ') : 'Ninguno'}
  - Sin vender 30+ días: ${deadStock.length > 0 ? deadStock.slice(0, 10).join(', ') : 'Ninguno'}
  - Capital congelado: $${deadValue.toFixed(0)}`

    const dataNote = totalTransacciones < 5
      ? '\n\nNOTA: Hay pocas ventas. Da consejos prácticos para empezar a vender más.'
      : ''

    const systemPrompt = `Eres un analista de negocios experto en retail y boutiques mexicanas. Tu cliente es "${boutique.name}".

DATOS DEL NEGOCIO (últimos 90 días):
${dataSummary}${dataNote}

INSTRUCCIONES:
- Responde EN ESPAÑOL MEXICANO, claro y directo
- Basa tu respuesta ÚNICAMENTE en los datos proporcionados arriba
- Si no tienes datos suficientes, dilo honestamente
- Da consejos prácticos y accionables, no teoría
- Mantén respuestas concisas (máximo 3 párrafos)
- Usa un tono profesional pero amigable, como un asesor de confianza
- Si la pregunta no tiene relación con el negocio, redirige cortésmente al tema
- Puedes sugerir promociones, ajustes de inventario, estrategias de precio, etc.

PREGUNTA DEL CLIENTE:
${question.trim()}`

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key de Gemini no configurada' }, { status: 500 })
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
              topP: 0.9,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini error (${response.status}):`, errorText)
        return NextResponse.json({ error: 'Error con la IA. Intenta de nuevo.' }, { status: 502 })
      }

      const data = await response.json()
      let answer = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('')?.trim() || ''

      if (!answer) {
        answer = 'No pude generar una respuesta. Intenta reformular tu pregunta.'
      }

      return NextResponse.json({ answer, model: MODEL })
    } catch (fetchError) {
      console.error('Gemini fetch error:', fetchError)
      return NextResponse.json({ error: 'Error de conexión con la IA. Intenta de nuevo.' }, { status: 502 })
    }
  } catch (error) {
    console.error('Error interno:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
