'use server'

import { getOrCreateBoutique } from '@/lib/boutique'

export async function syncBoutiqueAction() {
  return getOrCreateBoutique()
}
