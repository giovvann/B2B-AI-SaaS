-- ============================================================
-- Veliora Pay Automático para Menores — 30-sep-2026
-- Rieles sin Stripe ni adultos:
--   1) spei_comprobante  2) usdc_solana  3) ficha
-- Copia espejo de Veliora-Pay-Automatico-Menor/supabase/001_payments.sql
-- ============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.boutiques(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rail text not null check (rail in ('spei_comprobante','usdc_solana','ficha','oxxo_giftcard')),
  amount_mxn numeric not null check (amount_mxn > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  folio_hash text,
  tx_signature text unique,
  receipt_url text,
  code_enc text,
  ai_confidence numeric,
  ai_reason text,
  reviewed_by text default 'auto',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists payments_folio_hash_uidx
  on public.payments (folio_hash) where folio_hash is not null;
create index if not exists payments_boutique_idx on public.payments (boutique_id, created_at desc);
create index if not exists payments_status_idx on public.payments (status);

create table if not exists public.fichas (
  code text primary key,
  days int not null default 30,
  boutique_id uuid references public.boutiques(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;
drop policy if exists "payments_owner_read" on public.payments;
create policy "payments_owner_read" on public.payments
  for select using (auth.uid() = user_id);
drop policy if exists "payments_owner_insert" on public.payments;
create policy "payments_owner_insert" on public.payments
  for insert with check (auth.uid() = user_id and status = 'pending');

alter table public.fichas enable row level security;
-- Sin políticas SELECT para anon/authenticated: las fichas solo se tocan
-- vía service_role (canje atómico). Evita enumerar códigos válidos.

create or replace function public.activate_premium(p_boutique_id uuid, p_days int default 30)
returns timestamptz
language plpgsql security definer
as $$
declare v_expires timestamptz;
begin
  select subscription_expires_at into v_expires
  from public.boutiques where id = p_boutique_id;
  if v_expires is null or v_expires < now() then
    v_expires := now() + (p_days || ' days')::interval;
  else
    v_expires := v_expires + (p_days || ' days')::interval;
  end if;
  update public.boutiques
  set plan_type = 'premium', is_active = true, subscription_expires_at = v_expires
  where id = p_boutique_id;
  return v_expires;
end;
$$;

-- Solo service_role puede activar premium (los routes usan admin client).
-- Sin esto, cualquier usuario autenticado podría invocar el RPC y pagar $0.
-- Nota: en Postgres el EXECUTE viene de PUBLIC por defecto; el revoke a PUBLIC es el que cierra.
revoke all on function public.activate_premium(uuid, int) from anon, authenticated;
revoke all on function public.activate_premium(uuid, int) from public;
grant execute on function public.activate_premium(uuid, int) to service_role;
