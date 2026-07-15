'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getDeviceId } from '@/lib/device'
import { Loader2, ShieldAlert } from 'lucide-react'

export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      try {
        const deviceId = getDeviceId()
        if (!deviceId) {
          setErrorMsg('Identificando dispositivo...')
          return
        }

        const pinVerified = sessionStorage.getItem('veliora_pin_verified') === 'true'
        
        if (!pinVerified) {
          router.push('/dashboard')
          return
        }
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        const { data } = await supabase
          .from('dispositivos')
          .select('role, status')
          .eq('device_id', deviceId)
          .limit(1)
        
        const dispositivo = data?.[0]
        if (!dispositivo || dispositivo.role !== 'owner' || dispositivo.status !== 'approved') {
          router.push('/dashboard')
          return
        }
        
        setAllowed(true)
      } catch (err: any) {
        setErrorMsg(err.message)
      }
    }
    check()
  }, [])

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          {errorMsg && (
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <ShieldAlert className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
