-- 042_security_least_privilege.sql
-- Fecha a tabela sem politica e funcoes auxiliares expostas por engano.

begin;

-- Reservas sao gravadas apenas pelas funcoes transacionais do agendamento.
-- Usuarios da agenda e do PDV podem consultar o vinculo para suporte operacional.
alter table public.appointment_accessory_reservations enable row level security;

drop policy if exists "Module users can read accessory reservations"
on public.appointment_accessory_reservations;
create policy "Module users can read accessory reservations"
on public.appointment_accessory_reservations
for select
to authenticated
using (
  public.current_user_can_access('agenda')
  or public.current_user_can_access('pdv')
);

revoke all privileges on public.appointment_accessory_reservations from anon;
revoke insert, update, delete, truncate, references, trigger
on public.appointment_accessory_reservations from authenticated;
grant select on public.appointment_accessory_reservations to authenticated;

-- Funcoes de trigger e auxiliares so podem ser chamadas pelo proprio banco ou
-- por outras funcoes SECURITY DEFINER. Nao sao endpoints da Data API.
revoke execute on function public.handle_appointment_accessory_reservation_release()
from public, anon, authenticated;
revoke execute on function public.release_appointment_accessory_reservations(bigint, text)
from public, anon, authenticated;
revoke execute on function public.reserve_public_site_accessory(bigint, bigint, text, integer)
from public, anon, authenticated;
revoke execute on function public.sync_grooming_supply_stock()
from public, anon, authenticated;
revoke execute on function public.recalculate_pos_cash_expected(bigint)
from public, anon, authenticated;

commit;
