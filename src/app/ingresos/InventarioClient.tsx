'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Edit3, Trash2, Package, Sun, Moon, X, Ruler, Palette, Tag, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { deleteProduct } from './actions'

interface Product {
  id: string
  name: string
  brand: string | null
  season: string | null
  size: string | null
  color: string | null
  sku: string | null
  sale_price: number
  stock: number
}

interface Props {
  products: Product[]
  totalProducts: number
  inventoryValue: number
}

export function InventarioClient({ products, totalProducts, inventoryValue }: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setMounted(true) }, [])

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.size || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.color || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  )

  const handleDelete = (productId: string) => {
    if (!confirm('Eliminar este producto?')) return
    const formData = new FormData()
    formData.append('productId', productId)
    startTransition(async () => {
      try {
        await deleteProduct(formData)
      } catch (error) {
        alert('Error: ' + (error as Error).message)
      }
    })
  }

  const getStockIndicator = (stock: number) => {
    if (stock > 10) return { dot: 'bg-green-500', text: 'text-green-500', label: 'Buen stock' }
    if (stock >= 5) return { dot: 'bg-yellow-500', text: 'text-yellow-500', label: 'Stock bajo' }
    return { dot: 'bg-red-500', text: 'text-red-500', label: 'Stock critico' }
  }

  const isEmpty = products.length === 0

  if (!mounted) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-200 dark:bg-zinc-800 rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {theme === 'dark' ? <Sun className="w-5 h-5 text-zinc-800 dark:text-zinc-200" /> : <Moon className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />}
        </button>
        <button onClick={() => router.push('/ingresos/nuevo')}
          className="flex items-center gap-2 px-5 py-4 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl transition-colors border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={3} />
          <span className="text-sm md:text-base">INGRESO</span>
        </button>
        <button onClick={() => router.push('/')}
          className="flex items-center gap-2 px-5 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-colors border border-red-200 dark:border-red-900/50 shadow-sm">
          <X className="w-4 h-4" strokeWidth={3} />
          <span className="text-sm md:text-base">CERRAR</span>
        </button>
      </div>

      {!isEmpty && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1">Productos</div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">{totalProducts}</div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1">Valor total</div>
            <div className="text-3xl font-black text-emerald-500">
              ${inventoryValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="relative mb-6">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input type="text" placeholder="Buscar por nombre, marca, talla o color..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-12 py-4 text-base border-2 rounded-2xl focus:border-blue-500 focus:outline-none bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 transform -translate-y-1/2 text-zinc-400">
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          )}
        </div>
      )}

      {isEmpty ? (
        <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800">
          <Package className="w-20 h-20 mx-auto mb-5 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
          <h2 className="text-2xl font-black text-zinc-700 dark:text-zinc-300 mb-2">Tu inventario esta vacio</h2>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            Usa <span className="font-bold text-blue-500">NUEVO INGRESO (IA)</span> para empezar
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Search className="w-14 h-14 mx-auto mb-3 text-zinc-300" />
          <p className="text-lg font-bold text-zinc-500">Sin resultados para &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const stock = product.stock ?? 0
            const stockInfo = getStockIndicator(stock)
            const salePrice = product.sale_price ?? 0
            const hasSize = !!product.size
            const hasColor = !!product.color

            return (
              <div key={product.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{product.name}</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">
                        {product.brand || 'Sin marca'} {product.season ? '· ' + product.season : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">Precio</div>
                      <div className="text-2xl font-black text-emerald-500 leading-none">${salePrice.toFixed(0)}</div>
                    </div>
                  </div>

                  {(hasSize || hasColor || product.sku) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {hasSize && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-900/50">
                          <Ruler className="w-3 h-3" /> {product.size}
                        </span>
                      )}
                      {hasColor && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-lg border border-pink-200 dark:border-pink-900/50">
                          <Palette className="w-3 h-3" /> {product.color}
                        </span>
                      )}
                      {product.sku && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <Tag className="w-3 h-3" /> SKU: {product.sku}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stockInfo.dot}`} />
                      <span className={`text-sm font-bold ${stockInfo.text}`}>{stock} en stock</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => router.push(`/ingresos/${product.id}/editar`)}
                        className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-700 hover:text-blue-600 rounded-xl transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} disabled={isPending}
                        className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 disabled:opacity-50 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
