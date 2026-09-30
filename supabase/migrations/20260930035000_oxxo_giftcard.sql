-- Veliora Pay — riel OXXO gift card (tarjeta propia OXXO $200, al portador).
-- El cliente la compra en efectivo en cualquier OXXO, sube foto del ticket +
-- tarjeta con PIN, la IA valida y cifra el código (columna code_enc).
-- Solo service_role lee/escribe códigos (RLS ya bloquea anon/authenticated
-- en fichas; payments solo expone filas propias sin el código en claro).
alter table public.payments add column if not exists code_enc text;

alter table public.payments drop constraint if exists payments_rail_check;
alter table public.payments add constraint payments_rail_check
  check (rail in ('spei_comprobante','usdc_solana','ficha','oxxo_giftcard'));
