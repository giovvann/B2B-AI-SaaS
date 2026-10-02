-- Veliora Pay — variante Google Play $200 dentro del riel giftcard
-- (misma tabla, mismo motor IA; el route distingue por producto).
alter table public.payments drop constraint if exists payments_rail_check;
alter table public.payments add constraint payments_rail_check
  check (rail in ('spei_comprobante','usdc_solana','ficha','oxxo_giftcard','play_giftcard'));
