import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportarClient } from './ImportarClient'

export const metadata = {
  title: 'Importar Datos | Mi Boutique',
  description: 'Importa tu inventario desde Excel, CSV o JSON',
}

export default async function ImportarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()
  
  if (!boutique) {
    redirect('/')
  }
  
  return <ImportarClient boutiqueName={boutique.name} />
}