'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Check, Package, Tag, Calendar, Ruler, Palette, Hash, DollarSign, TrendingUp, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { updateProduct } from './actions'

interface Product {
  id: string
  name: string
  brand: string | null
  season: string | null
  size: string | null
  color: string | null
  sku: string | null
  purchase_price: number
  sale_price: number
  stock: number
}

interface Props {
  product: Product
  boutiqueName: string
}

export function EditarProductoClient({ product, boutiqueName }: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setMounted(true) }, [])

  const [name, setName] = useState(product.name)
  const [brand, setBrand] = useState(product.brand || '')
  const [season, setSeason] = useState(product.season || '')
  const [size, setSize] = useState(product.size || '')
  const [color, setColor] = useState(product.color || '')
  const [sku, setSku] = useState(product.sku || '')
  const [purchasePrice, setPurchasePrice] = useState(product.purchase_price)
  const [salePrice, setSalePrice] = useState(product.sale_price)
  const [stock, setStock] = useState(product.stock)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const margin = purchasePrice > 0 ? ((salePrice - purchasePrice) / purchasePrice) * 100 : 0

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) { setError('Escribe el nombre del producto'); return }
    if (purchasePrice <= 0) { setError('El precio de compra debe ser mayor a 0'); return }
    if (salePrice <= 0) { setError('El precio de venta debe ser mayor a 0'); return }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('productId', product.id)
        fd.append('name', name)
        fd.append('brand', brand)
        fd.append('season', season)
        fd.append('size', size)
        fd.append('color', color)
        fd.append('sku', sku)
        fd.append('purchase_price', purchasePrice.toString())
        fd.append('sale_price', salePrice.toString())
        fd.append('stock', stock.toString())
        await updateProduct(fd)

        setSuccess('Guardado correctamente')
        setTimeout(() => router.push('/ingresos'), 1000)
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-3">
      <div className="max-w-3xl mx-auto pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Editar producto</h1>
          <div className="flex items-center gap-2">
            {mounted && <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-zinc-400" /> : <Moon className="w-5 h-5 text-zinc-400" />}
            </button>}
            <button onClick={() => router.push('/ingresos')}
              className="p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl transition-colors">
              <X className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 rounded-xl p-3 text-sm text-red-700 dark:text-red-400 font-semibold">{error}</div>
        )}
        {success && (
          <div className="mb-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 rounded-xl p-3 text-sm text-green-700 dark:text-green-400 font-semibold">{success}</div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Producto
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Nombre del producto</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej: Camiseta básica"
                  className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-base font-semibold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Marca</label>
                  <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
                    placeholder="Ej: Nike, Adidas"
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Temporada</label>
                  <input type="text" value={season} onChange={e => setSeason(e.target.value)}
                    placeholder="Ej: Verano 2025"
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Ruler className="w-4 h-4" /> Talla, color y SKU
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Talla</label>
                <input type="text" value={size} onChange={e => setSize(e.target.value)}
                  placeholder="Ej: S, M, L, XL"
                  className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Color</label>
                <input type="text" value={color} onChange={e => setColor(e.target.value)}
                  placeholder="Ej: Blanco, Negro"
                  className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">SKU</label>
                <input type="text" value={sku} onChange={e => setSku(e.target.value)}
                  placeholder="Código interno"
                  className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Precios
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Precio de compra ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">$</span>
                  <input type="number" step="0.01" min="0" value={purchasePrice} onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Precio de venta ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">$</span>
                  <input type="number" step="0.01" min="0" value={salePrice} onChange={e => setSalePrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:border-blue-500 focus:outline-none placeholder:text-zinc-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Margen:</span>
              <span className={`font-black ${margin >= 50 ? 'text-green-500' : 'text-amber-500'}`}>{margin.toFixed(0)}%</span>
              <span className="text-zinc-400">|</span>
              <span className="text-zinc-500">Ganancia: <span className="font-bold">${(salePrice - purchasePrice).toFixed(2)}</span></span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Stock
            </h2>
            <input type="number" min="0" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)}
              className="w-full md:w-1/2 bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-lg font-bold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none" />
          </div>

          <button type="submit" disabled={isPending}
            className="w-full py-5 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-black text-lg tracking-wider rounded-2xl shadow-lg shadow-blue-500/30 disabled:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : <><Check className="w-5 h-5" strokeWidth={3} /> Guardar</>}
          </button>
        </form>
      </div>
    </div>
  )
}
