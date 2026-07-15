'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Smartphone, Crown, User, CheckCircle, XCircle, Loader2, Lock } from 'lucide-react'

interface Dispositivo {
  id: string
  device_id: string
  device_name: string
  role: 'owner' | 'employee'
  status: 'approved' | 'pending' | 'revoked'
  last_seen_at: string
  created_at: string
}

interface AdminPanelProps {
  open: boolean
  onClose: () => void
}

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')
  const [showPinChange, setShowPinChange] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)
  const supabase = createClient()

  const loadDevices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('dispositivos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDispositivos(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (open) loadDevices()
  }, [open, loadDevices])

  const handleApprove = async (dispositivo: Dispositivo) => {
    setActionLoading(dispositivo.id)
    try {
      const { error } = await supabase
        .from('dispositivos')
        .update({ status: 'approved' })
        .eq('id', dispositivo.id)

      if (error) throw error
      await loadDevices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (dispositivo: Dispositivo) => {
    if (!confirm(`¿Revocar acceso a este dispositivo? El empleado ya no podrá usar la app.`)) return
    setActionLoading(dispositivo.id)
    try {
      const { error } = await supabase
        .from('dispositivos')
        .update({ status: 'revoked' })
        .eq('id', dispositivo.id)

      if (error) throw error
      await loadDevices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangePin = async () => {
    setPinError('')
    setPinSuccess(false)
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('El PIN debe tener entre 4 y 6 dígitos')
      return
    }
    setPinLoading(true)
    try {
      const res = await fetch('/api/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPinSuccess(true)
      setNewPin('')
      setTimeout(() => { setShowPinChange(false); setPinSuccess(false) }, 2000)
    } catch (err: any) {
      setPinError(err.message || 'Error al cambiar PIN')
    } finally {
      setPinLoading(false)
    }
  }

  if (!open) return null

  const approvedCount = dispositivos.filter(d => d.status === 'approved').length
  const pendingCount = dispositivos.filter(d => d.status === 'pending').length
  const maxDevices = 6

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
            GESTIONAR EMPLEADOS
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Contador */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-4 mb-5 text-center">
          <span className="text-2xl font-black text-zinc-900 dark:text-white">
            {approvedCount}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">
            /6 dispositivos aprobados
          </span>
          {approvedCount >= maxDevices && (
            <p className="text-xs text-amber-500 font-semibold mt-1">
              Límite alcanzado. Revoca un dispositivo para aprobar otro.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Pendientes */}
        {pendingCount > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Pendientes ({pendingCount})
            </h3>
            <div className="space-y-2">
              {dispositivos.filter(d => d.status === 'pending').map(d => (
                <div
                  key={d.id}
                  className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {d.device_name || 'Dispositivo'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(d.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprove(d)}
                    disabled={actionLoading === d.id || approvedCount >= maxDevices}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-500 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
                  >
                    {actionLoading === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                    )}
                    Aprobar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aprobados */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-3">
            Aprobados ({approvedCount})
          </h3>
          <div className="space-y-2">
            {dispositivos.filter(d => d.status === 'approved').map(d => (
              <div
                key={d.id}
                className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${d.role === 'owner' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                    {d.role === 'owner' ? (
                      <Crown className="w-5 h-5 text-blue-500" />
                    ) : (
                      <User className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {d.device_name || 'Dispositivo'}
                      </p>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        d.role === 'owner'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {d.role === 'owner' ? 'Dueño' : 'Empleado'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Último acceso: {new Date(d.last_seen_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
                {d.role === 'employee' && (
                  <button
                    onClick={() => handleRevoke(d)}
                    disabled={actionLoading === d.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl transition-colors shrink-0"
                  >
                    {actionLoading === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" strokeWidth={2.5} />
                    )}
                    Revocar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sección vacía */}
        {dispositivos.length === 0 && !loading && (
          <div className="text-center py-10">
            <Smartphone className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              No hay dispositivos registrados. El tuyo se registrará automáticamente.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Cambiar PIN */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 mt-2">
          {!showPinChange ? (
            <button
              onClick={() => setShowPinChange(true)}
              className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Lock className="w-4 h-4" strokeWidth={2.5} />
              Cambiar PIN del dueño
            </button>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4" strokeWidth={2.5} />
                Nuevo PIN
              </h4>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-6 dígitos"
                className="w-full text-center text-xl tracking-[0.4em] bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
                disabled={pinLoading}
              />
              {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
              {pinSuccess && <p className="text-emerald-400 text-sm">✅ PIN actualizado correctamente</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleChangePin}
                  disabled={pinLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-40"
                >
                  {pinLoading ? 'Guardando...' : 'Guardar PIN'}
                </button>
                <button
                  onClick={() => { setShowPinChange(false); setNewPin(''); setPinError('') }}
                  className="px-4 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold rounded-2xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
