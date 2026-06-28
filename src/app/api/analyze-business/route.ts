import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'openrouter/owl-alpha'

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

    const now = Date.now()
    const userId = user.id
    const userRequests = userRequestMap.get(userId) || { count: 0, firstRequest: now }

    if (now - userRequests.firstRequest > 60000) {
      userRequestMap.set(userId, { count: 1, firstRequest: now })
    } else {
      userRequests.count++
      userRequestMap.set(userId, userRequests)

      if (userRequests.count > 1) {
        const secondsLeft = Math.ceil((60000 - (now - userRequests.firstRequest)) / 1000)
        return NextResponse.json(
          {
            error: `Has hecho una pregunta recientemente. Espera ${secondsLeft} segundos antes de hacer otra.`,
            retryAfter: secondsLeft,
            type: 'rate_limit'
          },
          { status: 429 }
        )
      }
    }

    const { data: boutique, error: boutiqueError } = await supabase
      .from('boutiques').select('id, name').eq('owner_id', user.id).single()
    if (boutiqueError || !boutique) {
      return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })
    }

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

    const totalVentas = sales?.reduce((sum, s: any) => sum + (s.total_amount || 0), 0) || 0
    const totalTransacciones = sales?.length || 0

    const productMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {}
    sales?.forEach((sale: any) => {
      sale.sale_items?.forEach((item: any) => {
        const product = item.products
        if (!product) return
        if (!productMap[product.name]) {
          productMap[product.name] = { name: product.name, quantity: 0, revenue: 0, profit: 0 }
        }
        productMap[product.name].quantity += item.quantity || 0
        productMap[product.name].revenue += (item.price_at_sale || 0) * (item.quantity || 0)
        productMap[product.name].profit += ((item.price_at_sale || 0) - (item.cost_at_sale || 0)) * (item.quantity || 0)
      })
    })

    const topProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10)
    const masRentables = Object.values(productMap).sort((a, b) => b.profit - a.profit).slice(0, 5)

    const paymentMethods: Record<string, number> = {}
    sales?.forEach((sale: any) => {
      const method = sale.payment_method || 'Desconocido'
      paymentMethods[method] = (paymentMethods[method] || 0) + (sale.total_amount || 0)
    })

    const dataNote = totalTransacciones < 5
      ? `\nNOTA: Hay pocas ventas (${totalTransacciones}). Da consejos prácticos con los datos disponibles.`
      : ''

    const dataSummary = `BOUTIQUE: ${boutique.name}
PERÍODO: Últimos 90 días
MÉTRICAS: ${totalTransacciones} transacciones, $${totalVentas.toFixed(2)} MXN total, ticket promedio $${totalTransacciones > 0 ? (totalVentas / totalTransacciones).toFixed(2) : '0'}
TOP VENDIDOS: ${topProducts.map((p, i) => `${i+1}. ${p.name} (${p.quantity}uds, $${p.revenue.toFixed(0)} ing, $${p.profit.toFixed(0)} gan)`).join(' | ')}
TOP RENTABLES: ${masRentables.map((p, i) => `${i+1}. ${p.name} ($${p.profit.toFixed(0)} gan)`).join(' | ')}
MÉTODOS PAGO: ${Object.entries(paymentMethods).map(([m, a]) => `${m}: $${a.toFixed(0)}`).join(' | ')}
${dataNote}`.trim()

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key de OpenRouter no configurada' }, { status: 500 })
    }

    const prompt = `Eres un consultor experto y motivacional en boutiques de ropa en México, super amigable y entusiasta. Responde en 3-5 oraciones cálidas, en español mexicano, texto plano sin markdown. Empieza con un saludo corto como "¡Claro!" o "¡Con gusto!" o "¡Qué buena pregunta!". Termina siempre con una frase motivacional corta como "¡Tú puedes!" o "¡Sigue así!" o "¡Vamos con todo!". Da consejos prácticos aplicables hoy.

DATOS: ${dataSummary}

PREGUNTA: ${question}

RESPUESTA:`

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`OpenRouter error (${response.status}):`, errorText)
        return NextResponse.json({ error: 'Error con la IA. Intenta de nuevo.' }, { status: 502 })
      }

      const data = await response.json()
      let answer = data.choices?.[0]?.message?.content?.trim() || ''

      if (answer && !/[.!?]$/.test(answer)) answer += '.'
      if (!answer) answer = 'Intenta con otra pregunta.'

      return NextResponse.json({ answer, model: MODEL })
    } catch (fetchError) {
      console.error('OpenRouter fetch error:', fetchError)
      return NextResponse.json({ error: 'Error de conexión con la IA. Intenta de nuevo.' }, { status: 502 })
    }
  } catch (error) {
    console.error('Error interno:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
