-- El log de avisos WhatsApp solo aceptaba 4 tipos (constraint CHECK) y los
-- avisos del ciclo de vida del trial ('trial_ending' / 'trial_expired')
-- rebotaban en silencio dentro del try/catch de logWhatsApp(): la corrida
-- real del 1-sep-2026 envió 4 avisos trial_expired y el log quedó en 0 filas.
-- Se extiende el constraint para incluir los tipos del lifecycle.
alter table public.whatsapp_alerts_log
  drop constraint if exists whatsapp_alerts_log_alert_type_check;

alter table public.whatsapp_alerts_log
  add constraint whatsapp_alerts_log_alert_type_check
  check (alert_type = any (array[
    'critical_stock',
    'dead_stock',
    'weekly_summary',
    'test',
    'trial_ending',
    'trial_expired'
  ]));
