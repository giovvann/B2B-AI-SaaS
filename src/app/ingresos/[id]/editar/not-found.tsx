import Link from 'next/link'
import { ArrowLeft, PackageX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
          <PackageX className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-3">
          Producto no encontrado
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          El producto que buscas no existe o no pertenece a tu boutique.
        </p>
        <Link
          href="/ingresos"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inventario
        </Link>
      </div>
    </div>
  )
}