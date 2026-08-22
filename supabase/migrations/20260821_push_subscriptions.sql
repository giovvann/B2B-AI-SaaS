-- ============================================================================
-- Migración: Suscripciones Push (Web Push API)
-- Fecha: 2026-08-21
-- ============================================================================

-- Tabla de suscripciones push por usuario/dispositivo
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_sub_own" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_push_sub_boutique ON public.push_subscriptions(boutique_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_user ON public.push_subscriptions(user_id);

-- Agregar columna para rastrear si ya se envió la notificación push
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS push_notified_at TIMESTAMPTZ;
