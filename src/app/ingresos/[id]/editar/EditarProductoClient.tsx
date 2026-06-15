'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  Sun,
  Moon,
  Save,
  DollarSign,
  Package,
  Tag,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { updateProduct } from './actions'

interface Product {
  id: string
  name: string
  brand: string | null
  season: string | null
  purchase_price: number
  sale_price: number
  stock: number
  created_at: string
}

interface EditarProductoClientProps {
  product: Product
  boutiqueName: string
}

export function EditarProductoClient({ product, boutiqueName }: EditarProductoClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  // Estado del formulario
  const [name, setName] = useState(product.name)
  const [brand, setBrand] = useState(product.brand || '')
  const [season, setSeason] = useState(product.season || '')
  const [purchasePrice, setPurchasePrice] = useState(product.purchase_price)
  const [salePrice, setSalePrice] = useState(product.sale_price)
  const [stock, setStock] = useState(product.stock)

  // Estados de UI
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Calcular margen automáticamente
  const margin = purchasePrice > 0 ? ((salePrice - purchasePrice) / purchasePrice) * 100 : 0
  const profit = salePrice - purchasePrice

  // Detectar cambios
  const hasChanges = 
    name !== product.name ||
    brand !== (product.brand || '') ||
    season !== (product.season || '') ||
    purchasePrice !== product.purchase_price ||
    salePrice !== product.sale_price ||
    stock !== product.stock

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('El nombre del producto es requerido')
      return
    }
    if (purchasePrice <= 0) {
      setError('El precio de compra debe ser mayor a 0')
      return
    }
    if (salePrice <= 0) {
      setError('El precio de venta debe ser mayor a 0')
      return
    }
    if (stock < 0) {
      setError('El stock no puede ser negativo')
      return
    }

    const formData = new FormData()
    formData.append('productId', product.id)
    formData.append('name', name)
    formData.append('brand', brand)
    formData.append('season', season)
    formData.append('purchase_price', purchasePrice.toString())
    formData.append('sale_price', salePrice.toString())
    formData.append('stock', stock.toString())

    startTransition(async () => {
      try {
        await updateProduct(formData)
        setSuccess('¡Producto actualizado exitosamente!')
        setTimeout(() => {
          router.push('/ingresos')
        }, 1500)
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
        router.push('/ingresos')
      }
    } else {
      router.push('/ingresos')
    }
  }

  // Aplicar margen sugerido (2.5x)
  const applySuggestedMargin = () => {
    setSalePrice(purchasePrice * 2.5)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              EDITAR PRODUCTO
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Boutique: <span className="text-blue-500 font-bold">{boutiqueName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
              ) : (
                <Moon className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 md:px-6 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-colors border border-red-200 dark:border-red-900/50"
            >
              <X className="w-5 h-5" strokeWidth={3} />
              <span className="text-base md:text-lg">CANCELAR</span>
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-400 font-semibold">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card principal - Información básica */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 md:w-6 md:h-6" />
              Información básica
            </h2>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej: Playera Básica Blanca"
                  className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-lg font-semibold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Marca y Temporada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Marca
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej: Nike, Zara"
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-base text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Temporada
                  </label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="Ej: Verano, Invierno"
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-base text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card - Precios y Margen */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              Precios y margen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Precio de compra */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                  Precio de compra
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-5 py-4 text-xl font-bold text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Precio de venta */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                  Precio de venta
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-5 py-4 text-xl font-bold text-emerald-600 dark:text-emerald-400 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Margen calculado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-900/50 rounded-2xl p-4">
                <div className="text-xs font-bold text-green-700 dark:text-green-400 tracking-wider uppercase mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Margen de ganancia
                </div>
                <div className="text-3xl font-black text-green-700 dark:text-green-400">
                  {margin.toFixed(1)}%
                </div>
                <div className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Ganancia: <span className="font-bold">${profit.toFixed(2)}</span> por unidad
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={applySuggestedMargin}
                  className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded-2xl transition-colors border-2 border-blue-200 dark:border-blue-900/50 text-sm md:text-base"
                >
                  💡 Aplicar margen sugerido (2.5x)
                </button>
              </div>
            </div>
          </div>

          {/* Card - Stock */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 md:w-6 md:h-6" />
              Inventario
            </h2>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                Stock disponible
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full md:w-1/2 bg-zinc-50 dark:bg-[#0a0a0a] border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-xl font-bold text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <div className="mt-2 flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  stock > 10 ? 'bg-green-500' : stock >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {stock > 10 && 'Nivel óptimo'}
                  {stock >= 5 && stock <= 10 && 'Nivel bajo - considera reabastecer'}
                  {stock < 5 && stock >= 0 && 'Nivel crítico - reabastecer pronto'}
                </span>
              </div>
            </div>
          </div>

          {/* Card - Info adicional (solo lectura) */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
              Información del sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-xl p-4">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  ID del producto
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 font-mono text-xs break-all">
                  {product.id}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-xl p-4">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Fecha de creación
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 font-semibold">
                  {new Date(product.created_at).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Botón de guardar - Fijo al final */}
          <div className="sticky bottom-4 z-10">
            <button
              type="submit"
              disabled={isPending || !hasChanges}
              className="w-full min-h-[90px] bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 disabled:cursor-not-allowed text-white font-black text-xl md:text-2xl tracking-wider rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.98] px-4"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span>GUARDANDO...</span>
                </>
              ) : (
                <>
                  <Save className="w-7 h-7" strokeWidth={3} />
                  <span>
                    {hasChanges ? 'GUARDAR CAMBIOS' : 'SIN CAMBIOS'}
                  </span>
                </>
              )}
            </button>
            {!hasChanges && (
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Modifica algún campo para habilitar el guardado
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}