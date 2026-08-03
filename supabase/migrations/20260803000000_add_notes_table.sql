-- ============================================================================
-- Migración: Tabla notes (notas del dueño vía Tipsy) + toggles de configuración
-- Fecha: 2026-08-03
-- ============================================================================

-- Toggles de configuración del dueño
ALTER TABLE public.boutiques
  ADD COLUMN IF NOT EXISTS auto_accept_employees BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pin_required BOOLEAN DEFAULT true;

-- Tabla de notas
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Política owner-based (mismo patrón que reminders)
CREATE POLICY "notes_owner" ON public.notes
  FOR ALL TO public
  USING (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = auth.uid()))
  WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE owner_id = auth.uid()));

-- Índice para consultas por boutique
CREATE INDEX IF NOT EXISTS idx_notes_boutique ON public.notes(boutique_id, created_at DESC);
