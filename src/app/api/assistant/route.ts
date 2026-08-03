import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Tipsy — Asistente IA de Veliora
 * Modelo principal: DeepSeek V4 Flash (1M ctx) vía opencode.ai/zen/v1
 * Fallback: NVIDIA Nemotron 3 Nano Omni 30B (OVNI)
 *
 * Tool-calling nativo: el modelo decide qué herramientas ejecutar
 * (agregar productos, registrar ventas, notas, recordatorios, contexto).
 */

const MAX_MESSAGES = 20
const MAX_QUESTIONS_PER_MINUTE = 10
const RATE_WINDOW_MS = 60_000
const CLEANUP_INTERVAL = 5 * 60 * 1000

const userRequestMap = new Map<string, { count: number; firstRequest: number }>()

setInterval(() => {
  const cutoff = Date.now() - 120_000
  for (const [key, val] of userRequestMap) {
    if (val.firstRequest < cutoff) userRequestMap.delete(key)
  }
}, CLEANUP_INTERVAL)

// ─── Definición de herramientas (OpenAI function-calling schema) ───

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_products',
      description:
        'Agrega uno o más productos al inventario de la boutique. Úsalo cuando el usuario mencione compras, mercancía nueva, llegada de productos, o describa artículos con nombre, marca, talla, color o precios. Extrae TODOS los productos mencionados.',
      parameters: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Nombre del producto (ej. "Playera blanca básica")' },
                brand: { type: 'string', description: 'Marca si se menciona' },
                season: { type: 'string', description: 'Temporada: primavera, verano, otoño, invierno, todo el año' },
                size: { type: 'string', description: 'Talla: Chica, Mediano, Grande, Extra Grande, Única...' },
                color: { type: 'string', description: 'Color del producto' },
                purchase_price: { type: 'number', description: 'Precio de compra en MXN' },
                sale_price: { type: 'number', description: 'Precio de venta en MXN' },
                sku: { type: 'string', description: 'Código SKU si se menciona' },
                stock: { type: 'number', description: 'Cantidad de piezas (default 1)' },
              },
              required: ['name'],
            },
          },
        },
        required: ['products'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'register_sale',
      description:
        'Registra una venta. Úsalo cuando el usuario diga que vendió algo ("vendí 2 playeras", "se fue un vestido"). Busca productos por nombre en el inventario; si no coincide exacto, elige el más parecido y confirma.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_name: { type: 'string', description: 'Nombre del producto vendido' },
                quantity: { type: 'number', description: 'Cantidad vendida (default 1)' },
                price: { type: 'number', description: 'Precio de venta si el usuario lo indica; si no, usa el del inventario' },
              },
              required: ['product_name'],
            },
          },
          payment_method: {
            type: 'string',
            enum: ['efectivo', 'tarjeta', 'transferencia', 'otro'],
            description: 'Método de pago si se menciona (default efectivo)',
          },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_note',
      description:
        'Guarda una nota rápida del negocio (ideas, pendientes, observaciones). No es un recordatorio con fecha, es una nota de texto.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título corto de la nota' },
          content: { type: 'string', description: 'Contenido de la nota' },
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_notes',
      description: 'Lista las notas guardadas de la boutique.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_note',
      description: 'Elimina una nota por su id.',
      parameters: {
        type: 'object',
        properties: { note_id: { type: 'string', description: 'ID de la nota a eliminar' } },
        required: ['note_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_reminder',
      description:
        'Crea un recordatorio con fecha (ej. "recuérdame mañana pedir más camisas", "el lunes llamar al proveedor"). Convierte fechas relativas a fechas concretas.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título del recordatorio' },
          note: { type: 'string', description: 'Detalle opcional' },
          due: { type: 'string', description: 'Fecha ISO (YYYY-MM-DDTHH:mm:ssZ). Calcula la fecha concreta a partir de expresiones relativas.' },
          priority: { type: 'string', enum: ['low', 'normal', 'high'], description: 'Prioridad: low, normal o high (default normal)' },
        },
        required: ['title', 'due'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_business_context',
      description:
        'Obtiene el contexto del negocio (métricas de ventas, inventario, stock bajo) para responder preguntas sobre el desempeño de la boutique.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Busca productos en el inventario por nombre, marca o atributo.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Texto a buscar' },
        },
        required: ['query'],
      },
    },
  },
]

// ─── Helpers de datos ───

async function getBoutique(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('boutiques')
    .select('id, name, plan_type')
    .eq('owner_id', userId)
    .maybeSingle()
  if (error || !data) throw new Error('Boutique no encontrada')
  return data
}

// ─── Tool handlers ───

async function handleAddProducts(supabase: any, boutiqueId: string, args: any): Promise<string> {
  const products = args.products || []
  if (!products.length) return 'No se detectaron productos.'
  const rows = products.map((p: any) => ({
    boutique_id: boutiqueId,
    name: String(p.name || '').trim(),
    brand: String(p.brand || '').trim() || null,
    season: String(p.season || '').trim() || null,
    size: String(p.size || '').trim() || null,
    color: String(p.color || '').trim() || null,
    purchase_price: p.purchase_price != null ? Number(p.purchase_price) : null,
    sale_price: p.sale_price != null ? Number(p.sale_price) : null,
    sku: String(p.sku || '').trim() || null,
    stock: p.stock != null ? Math.max(1, Math.round(Number(p.stock))) : 1,
  })).filter((r: any) => r.name)

  const { data, error } = await supabase.from('products').insert(rows).select('id, name, stock, sale_price')
  if (error) throw new Error('Error al guardar productos: ' + error.message)
  return `${data.length} producto(s) agregado(s): ${data.map((p: any) => `${p.name} (${p.stock} uds, $${p.sale_price ?? '?'})`).join(', ')}`
}

async function handleRegisterSale(supabase: any, boutiqueId: string, args: any): Promise<string> {
  const items = args.items || []
  if (!items.length) return 'No se detectaron productos vendidos.'

  const { data: products } = await supabase
    .from('products')
    .select('id, name, sale_price, purchase_price, stock')
    .eq('boutique_id', boutiqueId)

  const normalized: { id: string; name: string; quantity: number; price: number; cost: number; stock: number }[] = []
  const notFound: string[] = []

  for (const item of items) {
    const qName = String(item.product_name || '').trim().toLowerCase()
    const product = (products || []).find((p: any) =>
      p.name.toLowerCase().includes(qName) || qName.includes(p.name.toLowerCase())
    ) || (products || []).find((p: any) => {
      const words = qName.split(/\s+/).filter(w => w.length > 3)
      return words.every((w: string) => p.name.toLowerCase().includes(w))
    })
    if (!product) {
      notFound.push(String(item.product_name || '?'))
      continue
    }
    const quantity = item.quantity != null ? Math.max(1, Math.round(Number(item.quantity))) : 1
    const price = item.price != null ? Number(item.price) : Number(product.sale_price || 0)
    normalized.push({
      id: product.id,
      name: product.name,
      quantity,
      price,
      cost: Number(product.purchase_price || 0),
      stock: Number(product.stock || 0),
    })
  }

  if (!normalized.length) {
    return `No encontré en el inventario: ${notFound.join(', ')}. ¿Quieres agregarlos primero con "agrega [producto]"?`
  }

  const total = normalized.reduce((s, i) => s + i.price * i.quantity, 0)

  // Normalizar método de pago al formato del constraint (Efectivo/Transferencia/Tarjeta)
  const PAYMENT_MAP: Record<string, string> = {
    efectivo: 'Efectivo',
    cash: 'Efectivo',
    tarjeta: 'Tarjeta',
    card: 'Tarjeta',
    credito: 'Tarjeta',
    debito: 'Tarjeta',
    transferencia: 'Transferencia',
    transfer: 'Transferencia',
    otro: 'Efectivo',
  }
  const rawMethod = String(args.payment_method || 'efectivo').toLowerCase().trim()
  const paymentMethod = PAYMENT_MAP[rawMethod] || 'Efectivo'

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      boutique_id: boutiqueId,
      total_amount: total,
      payment_method: paymentMethod,
    })
    .select('id')
    .single()
  if (saleError) throw new Error('Error al registrar venta: ' + saleError.message)

  const saleItems = normalized.map((i) => ({
    sale_id: sale.id,
    product_id: i.id,
    quantity: i.quantity,
    price_at_sale: i.price,
    cost_at_sale: i.cost,
  }))
  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) throw new Error('Error al registrar artículos: ' + itemsError.message)

  // Descontar stock
  for (const i of normalized) {
    const newStock = Math.max(0, i.stock - i.quantity)
    await supabase.from('products').update({ stock: newStock }).eq('id', i.id)
  }

  const resumen = normalized.map((i) => `${i.quantity}× ${i.name} ($${i.price})`).join(', ')
  return `Venta registrada: ${resumen} = $${total.toFixed(2)} MXN (${paymentMethod})${notFound.length ? `\nNo encontrados en inventario: ${notFound.join(', ')}` : ''}`
}

async function handleAddNote(supabase: any, boutiqueId: string, args: any): Promise<string> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      boutique_id: boutiqueId,
      title: String(args.title || '').trim() || 'Nota',
      content: String(args.content || '').trim(),
    })
    .select('id, title')
    .single()
  if (error) throw new Error('Error al guardar nota: ' + error.message)
  return `Nota guardada: "${data.title}"`
}

async function handleListNotes(supabase: any, boutiqueId: string): Promise<string> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, content, created_at')
    .eq('boutique_id', boutiqueId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw new Error('Error al cargar notas: ' + error.message)
  if (!data.length) return 'No tienes notas guardadas todavía.'
  return data.map((n: any) => `• ${n.title}${n.content ? ': ' + n.content : ''} (${new Date(n.created_at).toLocaleDateString('es-MX')})`).join('\n')
}

async function handleDeleteNote(supabase: any, boutiqueId: string, args: any): Promise<string> {
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', args.note_id)
    .eq('boutique_id', boutiqueId)
    .select('id')
  if (error) throw new Error('Error al eliminar nota: ' + error.message)
  return data.length ? 'Nota eliminada.' : 'No encontré esa nota.'
}

async function handleAddReminder(supabase: any, boutiqueId: string, args: any): Promise<string> {
  // Normalizar prioridad al constraint (low/normal/high)
  const PRIORITY_MAP: Record<string, string> = {
    baja: 'low',
    low: 'low',
    normal: 'normal',
    media: 'normal',
    alta: 'high',
    high: 'high',
    urgente: 'high',
  }
  const rawPriority = String(args.priority || 'normal').toLowerCase().trim()
  const priority = PRIORITY_MAP[rawPriority] || 'normal'

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      boutique_id: boutiqueId,
      title: String(args.title || '').trim(),
      note: String(args.note || '').trim() || null,
      due: args.due ? new Date(args.due).toISOString() : null,
      priority,
    })
    .select('id, title, due')
    .single()
  if (error) throw new Error('Error al crear recordatorio: ' + error.message)
  const dueStr = data.due ? new Date(data.due).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'sin fecha'
  return `Recordatorio creado: "${data.title}" para ${dueStr} (prioridad ${priority})`
}

async function handleGetBusinessContext(supabase: any, boutiqueId: string): Promise<string> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: sales } = await supabase
    .from('sales')
    .select('id, total_amount, created_at, payment_method')
    .eq('boutique_id', boutiqueId)
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: products } = await supabase
    .from('products')
    .select('name, stock, sale_price, purchase_price')
    .eq('boutique_id', boutiqueId)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('boutique_id', boutiqueId)
    .gte('expense_date', ninetyDaysAgo.toISOString())

  const totalVentas = (sales || []).reduce((s: number, x: any) => s + Number(x.total_amount || 0), 0)
  const totalGastos = (expenses || []).reduce((s: number, x: any) => s + Number(x.amount || 0), 0)
  const lowStock = (products || []).filter((p: any) => Number(p.stock) <= 3)
  const totalPiezas = (products || []).reduce((s: number, p: any) => s + Number(p.stock || 0), 0)

  return [
    `VENTAS (90d): ${sales?.length || 0} transacciones, $${totalVentas.toFixed(2)} MXN`,
    `GASTOS (90d): $${totalGastos.toFixed(2)} MXN`,
    `PROFIT: $${(totalVentas - totalGastos).toFixed(2)} MXN`,
    `INVENTARIO: ${products?.length || 0} productos, ${totalPiezas} piezas`,
    `STOCK BAJO (≤3): ${lowStock.length ? lowStock.map((p: any) => `${p.name} (${p.stock})`).join(', ') : 'ninguno'}`,
  ].join('\n')
}

async function handleSearchProducts(supabase: any, boutiqueId: string, args: any): Promise<string> {
  const q = String(args.query || '').trim().toLowerCase()
  const { data } = await supabase
    .from('products')
    .select('name, brand, size, color, stock, sale_price, purchase_price')
    .eq('boutique_id', boutiqueId)
    .limit(100)
  const filtered = q
    ? (data || []).filter((p: any) =>
        [p.name, p.brand, p.size, p.color, p.season].some((f) => f && f.toLowerCase().includes(q)))
    : (data || [])
  if (!filtered.length) return 'No encontré productos con ese criterio.'
  return filtered.slice(0, 10).map((p: any) =>
    `${p.name}${p.brand ? ' (' + p.brand + ')' : ''}${p.size ? ' ' + p.size : ''}${p.color ? ' ' + p.color : ''} — ${p.stock} uds, $${p.sale_price ?? '?'} venta${p.purchase_price ? ', $' + p.purchase_price + ' compra' : ''}`
  ).join('\n')
}

// ─── Router de herramientas ───

async function runTool(supabase: any, boutiqueId: string, name: string, args: any): Promise<string> {
  switch (name) {
    case 'add_products': return handleAddProducts(supabase, boutiqueId, args)
    case 'register_sale': return handleRegisterSale(supabase, boutiqueId, args)
    case 'add_note': return handleAddNote(supabase, boutiqueId, args)
    case 'list_notes': return handleListNotes(supabase, boutiqueId)
    case 'delete_note': return handleDeleteNote(supabase, boutiqueId, args)
    case 'add_reminder': return handleAddReminder(supabase, boutiqueId, args)
    case 'get_business_context': return handleGetBusinessContext(supabase, boutiqueId)
    case 'search_products': return handleSearchProducts(supabase, boutiqueId, args)
    default: return 'Herramienta desconocida: ' + name
  }
}

// ─── Llamada a la IA (DeepSeek vía opencode, fallback NVIDIA) ───

async function callAI(messages: any[], tools: any[]): Promise<{ content: string; toolCalls: any[]; model: string; reasoningContent?: string }> {
  const baseUrl = process.env.AI_BASE_URL || 'https://opencode.ai/zen/v1'
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'deepseek-v4-flash-free'

  const payload: any = {
    model,
    messages,
    max_tokens: 1200,
    temperature: 0.7,
  }
  if (tools.length) payload.tools = tools
  if (tools.length) payload.tool_choice = 'auto'

  if (apiKey) {
    try {
      const res = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        const msg = data.choices?.[0]?.message
        return {
          content: msg?.content || '',
          toolCalls: msg?.tool_calls || [],
          model: data.model || model,
          reasoningContent: msg?.reasoning_content || undefined,
        }
      }
      console.error('Tipsy primary error', res.status, await res.text())
    } catch (e) {
      console.error('Tipsy primary fetch error', e)
    }
  }

  // Fallback: NVIDIA NIM (OVNI)
  const nvBase = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'
  const nvKey = process.env.NVIDIA_NIM_API_KEY
  const nvModel = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
  if (nvKey) {
    try {
      const res = await fetch(nvBase + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + nvKey },
        body: JSON.stringify({ model: nvModel, messages, max_tokens: 1200, temperature: 0.7 }),
      })
      if (res.ok) {
        const data = await res.json()
        const msg = data.choices?.[0]?.message
        return { content: msg?.content || '', toolCalls: [], model: nvModel }
      }
      console.error('Tipsy fallback error', res.status, await res.text())
    } catch (e) {
      console.error('Tipsy fallback fetch error', e)
    }
  }

  throw new Error('Sin modelo de IA disponible')
}

// ─── POST handler ───

export async function POST(request: NextRequest) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    const { message } = body
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Rate limit: 10 mensajes por minuto
    const now = Date.now()
    const userId = user.id
    const ur = userRequestMap.get(userId) || { count: 0, firstRequest: now }
    if (now - ur.firstRequest > RATE_WINDOW_MS) {
      userRequestMap.set(userId, { count: 1, firstRequest: now })
    } else {
      if (ur.count >= MAX_QUESTIONS_PER_MINUTE) {
        const secondsLeft = Math.ceil((RATE_WINDOW_MS - (now - ur.firstRequest)) / 1000)
        return NextResponse.json(
          { error: `Espera ${secondsLeft}s para seguir hablando con Tipsy.`, retryAfter: secondsLeft, type: 'rate_limit' },
          { status: 429 }
        )
      }
      ur.count++
      userRequestMap.set(userId, ur)
    }

    const boutique = await getBoutique(supabase, user.id)

    // Historial de conversación (limitado)
    const history: any[] = Array.isArray(body.history) ? body.history.slice(-MAX_MESSAGES) : []

    const systemPrompt = `Eres Tipsy, el asistente IA de Veliora para "${boutique.name}".
Eres experta en retail y boutiques mexicanas. Tu trabajo: ayudar al dueño a gestionar su negocio con lenguaje natural.

CAPACIDADES (usa las herramientas cuando corresponda):
- "compré 5 camisas blancas a $80 y las vendo en $150" -> add_products
- "vendí 2 playeras" -> register_sale (busca el producto en inventario)
- "guarda una nota: pedir más bolsas" -> add_note
- "recuérdame mañana llamar al proveedor" -> add_reminder
- "qué notas tengo" -> list_notes
- "cómo va mi negocio / cuánto he vendido" -> get_business_context
- "tienes [algo] en inventario?" -> search_products

REGLAS:
- Responde SIEMPRE en español mexicano, claro y cálido
- Cuando ejecutes una herramienta, confirma el resultado de forma natural
- Si no hay datos suficientes, dilo honestamente
- Sé concisa: máximo 3 párrafos por respuesta
- No inventes datos: usa siempre los resultados de las herramientas
- Si el usuario pide algo fuera de gestionar su negocio, redirige con tacto`

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
      { role: 'user', content: message },
    ]

    // Loop de tool-calling (máx 4 iteraciones)
    let finalContent = ''
    let usedModel = ''
    let toolResults: any[] = []
    let lastReasoning: string | undefined

    for (let i = 0; i < 4; i++) {
      const result = await callAI(messages, i === 0 ? TOOLS : [])
      usedModel = result.model
      lastReasoning = result.reasoningContent

      if (result.toolCalls?.length) {
        toolResults = []
        for (const tc of result.toolCalls) {
          let args: any = {}
          try { args = JSON.parse(tc.function.arguments || '{}') } catch {}
          const output = await runTool(supabase, boutique.id, tc.function.name, args)
          toolResults.push({ name: tc.function.name, args, output })
          const assistantMsg: any = { role: 'assistant', content: result.content || null, tool_calls: [tc] }
          if (lastReasoning) assistantMsg.reasoning_content = lastReasoning
          messages.push(assistantMsg)
          messages.push({ role: 'tool', tool_call_id: tc.id, content: output })
        }
        continue
      }

      finalContent = result.content
      break
    }

    if (!finalContent) {
      finalContent = toolResults.length
        ? 'Listo, ya quedó. ¿Algo más?'
        : 'No pude generar una respuesta. Intenta de nuevo.'
    }

    return NextResponse.json({ answer: finalContent, model: usedModel, toolResults })
  } catch (error: any) {
    console.error('Tipsy error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
