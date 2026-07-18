-- ============================================================================
-- Migración: Agregar WhatsApp alerts + plan_type para freemium
-- Fecha: 2026-07-17
-- ============================================================================

-- Agregar columna para activar/desactivar alertas WhatsApp
ALTER TABLE public.boutiques
  ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled BOOLEAN DEFAULT true;

-- Agregar columna para el tipo de plan
ALTER TABLE public.boutiques
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial'
  CHECK (plan_type IN ('free', 'trial', 'premium', 'expired'));

-- Agregar columna para el número de WhatsApp del dueño (para alertas)
ALTER TABLE public.boutiques
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Actualizar boutiques existentes: las activas con trial son 'trial'
UPDATE public.boutiques
SET plan_type = CASE
  WHEN is_trial = true AND is_active = true THEN 'trial'
  WHEN is_trial = false AND is_active = true THEN 'premium'
  WHEN is_active = false THEN 'expired'
  ELSE 'free'
END
WHERE plan_type IS NULL;

-- Crear tabla de dispositivos para limitar a 6
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT DEFAULT 'Dispositivo',
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'employee')),
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(boutique_id, device_id)
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_select_own" ON public.devices
  FOR SELECT TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "devices_insert_own" ON public.devices
  FOR INSERT TO authenticated
  WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "devices_delete_own" ON public.devices
  FOR DELETE TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

-- Crear tabla de historial de alertas WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical_stock', 'dead_stock', 'weekly_summary', 'test')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

ALTER TABLE public.whatsapp_alerts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_own" ON public.whatsapp_alerts_log
  FOR SELECT TO authenticated
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "alerts_insert_own" ON public.whatsapp_alerts_log
  FOR INSERT TO authenticated
  WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = (SELECT auth.uid())));
