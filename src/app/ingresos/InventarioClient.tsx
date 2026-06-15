'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Edit3, Trash2, Package, Sun, Moon, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { deleteProduct } from './actions'

interface Product {
  id: string
  name: string
  brand: string | null
  season: string | null
  sale_price: number | null
  stock: number | null
}

interface InventarioClientProps {
  products: Product[]
  totalProducts: number
  inventoryValue: number
}

export function InventarioClient({
  products,
  totalProducts,
  inventoryValue,
}: InventarioClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  )

  const handleDelete = (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    const formData = new FormData()
    formData.append('productId', productId)

    startTransition(async () => {
      try {
        await deleteProduct(formData)
      } catch (error) {
        alert('Error al eliminar: ' + (error as Error).message)
      }
    })
  }

  const handleCancel = () => {
    router.push('/')
  }

  const getStockIndicator = (stock: number) => {
    if (stock > 10) return { dot: 'bg-green-500', text: 'text-green-500 dark:text-green-400', label: 'Óptimo' }
    if (stock >= 5) return { dot: 'bg-yellow-500', text: 'text-yellow-500 dark:text-yellow-400', label: 'Bajo' }
    return { dot: 'bg-red-500', text: 'text-red-500 dark:text-red-400', label: 'Crítico' }
  }

  const isEmpty = products.length === 0

  return (
    <div>
      {/* Barra superior: Tema + Cancelar */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 shadow-sm"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
          ) : (
            <Moon className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
          )}
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-5 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-colors border border-red-200 dark:border-red-900/50 shadow-sm"
        >
          <X className="w-4 h-4" strokeWidth={3} />
          <span className="text-sm md:text-base">CERRAR</span>
        </button>
      </div>

      {/* Estadísticas minimalistas */}
      {!isEmpty && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.15em] uppercase mb-1">
              Productos
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {totalProducts}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.15em] uppercase mb-1">
              Valor total
            </div>
            <div className="text-3xl font-black text-emerald-500 dark:text-emerald-400">
              ${inventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {/* Buscador (solo si hay productos) */}
      {!isEmpty && (
        <div className="relative mb-6">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-12 py-4 text-base border-2 rounded-2xl focus:border-blue-500 focus:outline-none bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          )}
        </div>
      )}

      {/* Contenido */}
      {isEmpty ? (
        <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800">
          <Package className="w-20 h-20 mx-auto mb-5 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
          <h2 className="text-2xl font-black text-zinc-700 dark:text-zinc-300 mb-2 tracking-tight">
            Tu inventario está vacío
          </h2>
          <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Haz clic en <span className="font-bold text-blue-500">NUEVO INGRESO (IA)</span> arriba para agregar productos con IA
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Search className="w-14 h-14 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="text-lg font-bold text-zinc-500 dark:text-zinc-400">
            Sin resultados para "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 text-sm font-bold text-blue-500 hover:text-blue-600 uppercase tracking-wider"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const stock = product.stock ?? 0
            const stockInfo = getStockIndicator(stock)
            const salePrice = product.sale_price ?? 0

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate uppercase tracking-wider">
                      {product.brand || 'Sin marca'} · {product.season || 'Sin temporada'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Precio
                    </div>
                    <div className="text-2xl font-black text-emerald-500 dark:text-emerald-400 leading-none">
                      ${salePrice.toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Stock + Acciones */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stockInfo.dot}`} />
                    <span className={`text-sm font-bold ${stockInfo.text}`}>
                      {stock} en stock
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      · {stockInfo.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/ingresos/${product.id}/editar`)}
                      className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                      aria-label="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={isPending}
                      className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 rounded-xl transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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