-- 027_delete_grooming_supply_movement.sql
-- Exclui movimentação de insumo ajustando estoque e financeiro vinculado.

create or replace function public.delete_grooming_supply_movement(
  selected_movement_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_movement record;
  linked_financial_entry record;
  remaining_total numeric := 0;
  remaining_count integer := 0;
begin
  if not (
    public.current_user_can_access('servicos')
    or public.current_user_can_access('financeiro')
  ) then
    raise exception 'Usuário sem permissão para excluir movimentação de insumo.';
  end if;

  select *
  into selected_movement
  from public.grooming_supply_movements
  where id = selected_movement_id;

  if selected_movement.id is null then
    raise exception 'Movimentação não encontrada.';
  end if;

  if selected_movement.financial_entry_id is not null then
    select *
    into linked_financial_entry
    from public.financial_entries
    where id = selected_movement.financial_entry_id;

    if linked_financial_entry.id is not null
      and linked_financial_entry.status_pagamento = 'Pago'
    then
      raise exception 'Não é possível excluir uma movimentação vinculada a uma despesa já paga.';
    end if;
  end if;

  delete from public.grooming_supply_movements
  where id = selected_movement_id;

  if selected_movement.financial_entry_id is not null then
    select
      count(*),
      coalesce(sum(total_cost), 0)
    into remaining_count, remaining_total
    from public.grooming_supply_movements
    where financial_entry_id = selected_movement.financial_entry_id;

    if remaining_count = 0 then
      delete from public.financial_entries
      where id = selected_movement.financial_entry_id
        and origem = 'grooming_supply'
        and status_pagamento = 'Pendente';
    else
      update public.financial_entries
      set valor = remaining_total
      where id = selected_movement.financial_entry_id
        and origem = 'grooming_supply'
        and status_pagamento = 'Pendente';
    end if;
  end if;
end;
$$;

revoke execute on function public.delete_grooming_supply_movement(bigint) from public;
revoke execute on function public.delete_grooming_supply_movement(bigint) from anon;
grant execute on function public.delete_grooming_supply_movement(bigint) to authenticated;

select
  routine_name,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'delete_grooming_supply_movement';
