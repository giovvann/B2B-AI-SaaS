-- Ciclo de vida del trial: idempotencia de los avisos de expiración.
--
-- Una fila por boutique+evento+periodo. El índice UNIQUE garantiza que
-- cada aviso (D-1 y expirado) sale UNA sola vez por periodo de prueba,
-- aunque el cron diario corra varias veces.
--
-- Sin políticas RLS: solo escribe service_role (bypass de RLS) desde
-- /api/push/send → runTrialLifecycle().

create table if not exists public.trial_notifications (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.boutiques(id) on delete cascade,
  event text not null,               -- 'trial_ending' | 'trial_expired'
  period_end timestamptz not null,   -- subscription_expires_at del periodo avisado
  sent_at timestamptz not null default now(),
  unique (boutique_id, event, period_end)
);

alter table public.trial_notifications enable row level security;
