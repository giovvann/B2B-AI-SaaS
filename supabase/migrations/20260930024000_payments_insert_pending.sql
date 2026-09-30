-- Veliora Pay — las filas 'approved' solo las crea service_role (routes).
-- Los dueños solo pueden proponer 'pending' (el insert directo con anon key
-- con status aprobado queda bloqueado; esas filas además son inertes porque
-- el acceso se otorga solo vía activate_premium).
drop policy if exists "payments_owner_insert" on public.payments;
create policy "payments_owner_insert" on public.payments
  for insert with check (auth.uid() = user_id and status = 'pending');
