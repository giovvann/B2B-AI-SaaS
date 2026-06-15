'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Edit3, Trash2, Package, Sparkles } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  )

  const handleDelete = (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
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

  // Colores dinámicos según stock
  const getStockIndicator = (stock: number) => {
    if (stock > 10) return { dot: 'bg-green-500', text: 'text-green-500 dark:text-green-400', label: 'Óptimo' }
    if (stock >= 5) return { dot: 'bg-yellow-500', text: 'text-yellow-500 dark:text-yellow-400', label: 'Bajo' }
    return { dot: 'bg-red-500', text: 'text-red-500 dark:text-red-400', label: 'Crítico' }
  }

  const isEmpty = products.length === 0

  return (
    <>
      {/* Estadísticas rápidas */}
      {!isEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase mb-1">
              Total de productos
            </div>
            <div className="text-4xl font-black text-zinc-900 dark:text-white">
              {totalProducts}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase mb-1">
              Valor del inventario
            </div>
            <div className="text-4xl font-black text-emerald-500 dark:text-emerald-400">
              ${inventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Buscador (solo si hay productos) */}
      {!isEmpty && (
        <div className="relative mb-6">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 text-lg border-2 rounded-2xl focus:border-blue-500 focus:outline-none bg-white dark:bg-[#1a1a1a] border-zinc-300 dark:border-zinc-700 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Contenido principal */}
      {isEmpty ? (
        <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700">
          <Package className="w-24 h-24 mx-auto mb-6 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">
            Tu inventario está vacío
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Haz clic en <span className="font-bold text-blue-500">NUEVO INGRESO (IA)</span> arriba para agregar productos con IA
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Search className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
          <p className="text-xl font-semibold text-zinc-500 dark:text-zinc-400">
            No se encontraron productos para "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const stock = product.stock ?? 0
            const stockInfo = getStockIndicator(stock)
            const salePrice = product.sale_price ?? 0

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm hover:shadow-xl transition-all group"
              >
                {/* Header: Nombre + Marca/Temporada */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {product.brand || 'Sin marca'} · {product.season || 'Sin temporada'}
                  </p>
                </div>

                {/* Precio de venta grande */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase mb-1">
                    Precio de venta
                  </div>
                  <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                    ${salePrice.toFixed(2)}
                  </div>
                </div>

                {/* Stock con indicador visual */}
                <div className="flex items-center justify-between py-3 mb-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stockInfo.dot} ${stock > 10 ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Stock:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${stockInfo.text}`}>
                      {stock}
                    </span>
                    <span className={`text-xs font-bold ${stockInfo.text} uppercase tracking-wider`}>
                      {stockInfo.label}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/ingresos/${product.id}/editar`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl font-bold text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:disabled:bg-red-900 rounded-xl font-bold text-sm text-white transition-colors active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}