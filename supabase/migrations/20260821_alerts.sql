-- ============================================================================
-- Migración: Alertas inteligentes (récord 7 días, producto agotado, stock bajo)
-- Fecha: 2026-08-21
--
-- dedupe_key + UNIQUE(boutique_id, dedupe_key) = idempotencia total:
-- aunque el check corra 20 veces, la alerta solo se crea una vez.
-- resolved_at + renombrado de key permite que la alerta "se rearme"
-- cuando el producto se reabastece.
-- ============================================================================

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references boutiques(id) on delete cascade,
  type text not null check (type in ('record_7d', 'stock_out', 'low_stock')),
  title text not null,
  body text not null default '',
  url text not null default '/metricas',
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  resolved_at timestamptz,
  unique (boutique_id, dedupe_key)
);

create index if not exists alerts_boutique_idx on alerts (boutique_id, created_at desc);
create index if not exists alerts_pending_idx on alerts (notified_at) where notified_at is null;

alter table alerts enable row level security;

-- El dueño solo lee alertas de su boutique (escritura = service role vía API)
drop policy if exists "alerts_select_own" on alerts;
create policy "alerts_select_own" on alerts
  for select using (
    exists (select 1 from boutiques b where b.id = alerts.boutique_id and b.owner_id = auth.uid())
  );
