-- ============================================================
-- Veliora Pay — hardening 30-sep-2026 (auditoría post-deploy)
-- 1) activate_premium solo ejecutable por service_role.
--    Sin esto, cualquier usuario autenticado podría invocar el RPC
--    y auto-activarse premium sin pagar.
-- 2) fichas sin lectura para anon/authenticated: los códigos solo se
--    tocan vía service_role (canje atómico). Evita enumerar fichas válidas.
-- ============================================================

revoke all on function public.activate_premium(uuid, int) from anon, authenticated;
-- Nota: en Postgres el EXECUTE viene de PUBLIC por defecto; sin esta línea el revoke anterior no sirve.
revoke all on function public.activate_premium(uuid, int) from public;
grant execute on function public.activate_premium(uuid, int) to service_role;

drop policy if exists "fichas_read_all_auth" on public.fichas;
-- Sin políticas SELECT para anon/authenticated: solo service_role accede.
