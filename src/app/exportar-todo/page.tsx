import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DownloadAllButton } from './DownloadAllButton'

export const metadata = {
  title: 'Exportar Todo | Veliora',
  description: 'Descarga todos tus datos de Veliora en un solo archivo',
}

export default async function ExportarTodoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!boutique) redirect('/login')

  // Contar registros para mostrar
  const { count: productCount } = await supabase
    .from('products').select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutique.id)

  const { count: salesCount } = await supabase
    .from('sales').select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutique.id)

  const { count: expensesCount } = await supabase
    .from('expenses').select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutique.id)

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-8 transition-colors group text-sm"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al panel
        </Link>

        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl p-8 border border-white/[0.06]">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Exportar Todos mis Datos</h1>
          <p className="text-zinc-400 text-sm text-center mb-8">
            Descarga un archivo ZIP con todos los datos de <strong className="text-white">{boutique.name}</strong> en formato CSV.
            Compatible con Excel, Google Sheets y la mayoría de apps de inventario.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/[0.03] rounded-2xl p-5 text-center border border-white/[0.06]">
              <div className="text-3xl font-black text-white mb-1">{productCount ?? 0}</div>
              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Productos</div>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-5 text-center border border-white/[0.06]">
              <div className="text-3xl font-black text-white mb-1">{salesCount ?? 0}</div>
              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Ventas</div>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-5 text-center border border-white/[0.06]">
              <div className="text-3xl font-black text-white mb-1">{expensesCount ?? 0}</div>
              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Gastos</div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <p className="text-amber-400 text-xs font-semibold">
              ℹ️ Este ZIP contiene todos tus datos para que puedas migrar a cualquier otra plataforma en cualquier momento. 
              Tus datos son tuyos.
            </p>
          </div>

          <DownloadAllButton boutiqueName={boutique.name} />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            No quiero exportar, volver al panel
          </Link>
        </div>
      </div>
    </div>
  )
}
