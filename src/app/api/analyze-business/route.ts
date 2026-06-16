import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MODELS_TO_TRY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
]

// Mapa en memoria para trackear requests por usuario (simple rate limiter)
const userRequestMap = new Map<string, { count: number; firstRequest: number }>()

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

    // Rate limiting personalizado: máximo 1 pregunta cada 60 segundos
    const now = Date.now()
    const userId = user.id
    const userRequests = userRequestMap.get(userId) || { count: 0, firstRequest: now }
    
    // Limpiar si pasó más de 1 minuto desde la primera petición
    if (now - userRequests.firstRequest > 60000) {
      userRequestMap.set(userId, { count: 1, firstRequest: now })
    } else {
      userRequests.count++
      userRequestMap.set(userId, userRequests)
      
      // Si ya hizo 1 pregunta en el último minuto, bloquear
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

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key no configurada' }, { status: 500 })
    }

    const prompt = `Consultor experto en boutiques de ropa en México. Responde en 2-4 oraciones cortas, español México, texto plano sin markdown, termina con punto final. Consejos prácticos aplicables hoy.

DATOS: ${dataSummary}

PREGUNTA: ${question}

RESPUESTA:`

    let lastError = ''
    let lastStatus = 500
    
    for (const model of MODELS_TO_TRY) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        
        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
          }),
        })

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          let answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
          const finishReason = geminiData.candidates?.[0]?.finishReason

          if (finishReason === 'MAX_TOKENS') {
            lastError = 'MAX_TOKENS'
            continue
          }

          if (answer && !/[.!?]$/.test(answer)) answer = answer + '.'
          if (!answer) answer = 'Intenta con otra pregunta.'

          console.log(`✅ ${model}: respuesta OK`)
          return NextResponse.json({ answer, model })
        }

        const errorText = await geminiResponse.text()
        lastStatus = geminiResponse.status
        lastError = errorText
        
        if (geminiResponse.status === 429) {
          console.log(`⏱️ Rate limit de Google con ${model}`)
          continue
        }
        
        if (geminiResponse.status === 404) continue
      } catch (fetchError) {
        lastError = String(fetchError)
      }
    }

    let userFriendlyError = 'Error con la IA. Intenta de nuevo en unos segundos.'
    try {
      const parsed = JSON.parse(lastError)
      const msg = parsed.error?.message || ''
      if (msg.includes('quota') || msg.includes('Quota')) {
        userFriendlyError = 'Límite de la API alcanzado. Habilita billing en Google AI Studio para más requests (te dan $300 USD gratis).'
      } else if (msg.includes('API key')) {
        userFriendlyError = 'API key inválida.'
      } else if (msg.includes('billing')) {
        userFriendlyError = 'Billing requerido. Ve a Google AI Studio y activa billing (te dan $300 USD gratis).'
      }
    } catch {}

    return NextResponse.json({ error: userFriendlyError }, { status: lastStatus })
  } catch (error) {
    console.error('Error interno:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}