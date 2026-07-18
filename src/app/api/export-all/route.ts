import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

/**
 * GET /api/export-all
 * 
 * Exporta TODOS los datos de la boutique en un ZIP listo para migración.
 * Incluye: productos, ventas, gastos (CSV) + guía de migración (TXT).
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: boutique } = await supabase
      .from('boutiques')
      .select('id, name')
      .eq('owner_id', user.id)
      .single()

    if (!boutique) {
      return NextResponse.json({ error: 'Boutique no encontrada' }, { status: 404 })
    }

    // ============================================================
    // 1. CARGAR DATOS
    // ============================================================

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('boutique_id', boutique.id)
      .order('name')

    const { data: sales } = await supabase
      .from('sales')
      .select(`*, sale_items (*, products (name, brand, sku))`)
      .eq('boutique_id', boutique.id)
      .order('created_at', { ascending: false })

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('boutique_id', boutique.id)
      .order('expense_date', { ascending: false })

    // ============================================================
    // 2. GENERAR CSVs
    // ============================================================

    function toCSV(headers: string[], rows: any[], fieldMap: (row: any) => string[]) {
      const escape = (v: any) => {
        const s = String(v ?? '')
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      }
      return [headers.join(','), ...rows.map(r => fieldMap(r).map(escape).join(','))].join('\n')
    }

    // Productos CSV
    const productsCSV = toCSV(
      ['Nombre', 'Marca', 'Temporada', 'Talla', 'Color', 'SKU', 'Precio_Compra', 'Precio_Venta', 'Stock', 'Fecha_Creacion'],
      products || [],
      (p: any) => [p.name, p.brand, p.season, p.size, p.color, p.sku, p.purchase_price, p.sale_price, p.stock, p.created_at]
    )

    // Ventas CSV
    const salesRows: any[] = []
    ;(sales || []).forEach((sale: any) => {
      if (sale.sale_items?.length > 0) {
        sale.sale_items.forEach((item: any) => {
          const product = item.products
          salesRows.push({
            Venta_ID: sale.id, Fecha: sale.created_at, Metodo_Pago: sale.payment_method,
            Total_Venta: sale.total_amount, Nota: sale.note || '',
            Producto: product?.name || '(eliminado)', Marca: product?.brand || '', SKU: product?.sku || '',
            Cantidad: item.quantity, Precio_Venta: item.price_at_sale, Costo: item.cost_at_sale,
            Subtotal: item.price_at_sale * item.quantity,
            Ganancia: (item.price_at_sale - item.cost_at_sale) * item.quantity,
          })
        })
      }
    })
    const salesCSV = toCSV(
      ['Venta_ID', 'Fecha', 'Metodo_Pago', 'Total_Venta', 'Nota', 'Producto', 'Marca', 'SKU', 'Cantidad', 'Precio_Venta', 'Costo', 'Subtotal', 'Ganancia'],
      salesRows, (r: any) => [r.Venta_ID, r.Fecha, r.Metodo_Pago, r.Total_Venta, r.Nota, r.Producto, r.Marca, r.SKU, r.Cantidad, r.Precio_Venta, r.Costo, r.Subtotal, r.Ganancia]
    )

    // Gastos CSV
    const expensesCSV = toCSV(
      ['ID', 'Descripcion', 'Categoria', 'Monto', 'Fecha', 'Nota'],
      expenses || [], (e: any) => [e.id, e.description, e.category, e.amount, e.expense_date, e.note || '']
    )

    // Guía de migración TXT
    const migrationGuide = [
      '╔════════════════════════════════════════════╗',
      `║  GUÍA DE MIGRACIÓN — Veliora                ║`,
      `║  Exportado: ${new Date().toLocaleDateString('es-MX')}              ║`,
      '╚════════════════════════════════════════════╝',
      '',
      `TIENDA: ${boutique.name}`,
      `USUARIO: ${user.email}`,
      '',
      '═══════════════════════════════════════════════',
      'ARCHIVOS INCLUIDOS:',
      '',
      `productos.csv  → ${products?.length || 0} productos`,
      `ventas.csv     → ${salesRows.length} líneas de ventas`,
      `gastos.csv     → ${expenses?.length || 0} gastos`,
      '',
      'CÓMO IMPORTAR A OTRA APP:',
      '1. Abre los CSVs en Excel o Google Sheets',
      '2. productos.csv: cada fila = un producto con stock',
      '3. ventas.csv: cada fila = un item vendido',
      '4. gastos.csv: lista de gastos',
      '',
      'NOTAS:',
      '- Fechas en formato ISO (YYYY-MM-DD)',
      '- Precios en MXN',
      '- Archivos en UTF-8',
      '',
      'Veliora — Si necesitas ayuda: wa.me/528342177709',
    ].join('\n')

    // Resumen JSON
    const summary = JSON.stringify({
      boutique: boutique.name,
      exportedAt: new Date().toISOString(),
      user: user.email,
      counts: {
        products: products?.length || 0,
        sales: sales?.length || 0,
        saleItems: salesRows.length,
        expenses: expenses?.length || 0,
      },
    }, null, 2)

    // ============================================================
    // 3. ARMAR ZIP
    // ============================================================
    const zip = new JSZip()
    zip.file('productos.csv', productsCSV)
    zip.file('ventas.csv', salesCSV)
    zip.file('gastos.csv', expensesCSV)
    zip.file('GUIA_MIGRACION.txt', migrationGuide)
    zip.file('resumen.json', summary)

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const safeFileName = `${boutique.name.replace(/[^a-zA-Z0-9]/g, '_')}_Veliora_${new Date().toISOString().split('T')[0]}.zip`

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Content-Length': String(zipBuffer.length),
      },
    })
  } catch (error) {
    console.error('Error en export-all:', error)
    return NextResponse.json({ error: 'Error generando exportación' }, { status: 500 })
  }
}
