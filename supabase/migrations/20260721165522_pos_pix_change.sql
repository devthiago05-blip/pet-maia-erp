alter table public.pos_sales
  add column if not exists change_amount numeric(12, 2) not null default 0
    check (change_amount >= 0),
  add column if not exists change_method text
    check (change_method is null or change_method in ('Dinheiro', 'PIX')),
  add column if not exists cash_received numeric(12, 2)
    check (cash_received is null or cash_received >= 0);

create or replace function public.create_pos_sale_with_change(
  customer_tutor_id bigint,
  customer_name text,
  items jsonb,
  payments jsonb,
  selected_discount numeric,
  selected_surcharge numeric,
  selected_reason text,
  selected_cash_received numeric,
  selected_change_amount numeric,
  selected_change_method text
) returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_sale_id bigint;
  allocated_cash numeric(12, 2);
  cash_received_value numeric(12, 2);
  change_value numeric(12, 2);
  physical_cash_entry numeric(12, 2);
begin
  if auth.uid() is null or not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  change_value := round(greatest(coalesce(selected_change_amount, 0), 0), 2);
  cash_received_value := round(greatest(coalesce(selected_cash_received, 0), 0), 2);

  if change_value <= 0 then
    raise exception 'O valor do troco precisa ser maior que zero';
  end if;
  if selected_change_method not in ('Dinheiro', 'PIX') then
    raise exception 'Escolha troco em Dinheiro ou PIX';
  end if;

  select coalesce(sum((payment ->> 'amount')::numeric), 0)
  into allocated_cash
  from jsonb_array_elements(payments) payment
  where trim(payment ->> 'payment_method') = 'Dinheiro';

  if round(cash_received_value, 2) <>
     round(allocated_cash + change_value, 2) then
    raise exception 'Dinheiro recebido incompatível com a venda e o troco';
  end if;

  new_sale_id := public.create_pos_sale_with_payments_adjusted(
    customer_tutor_id,
    customer_name,
    items,
    payments,
    selected_discount,
    selected_surcharge,
    selected_reason
  );

  update public.pos_sales
  set change_amount = change_value,
      change_method = selected_change_method,
      cash_received = cash_received_value
  where id = new_sale_id;

  physical_cash_entry := cash_received_value -
    case when selected_change_method = 'Dinheiro' then change_value else 0 end;

  update public.pos_cash_movements
  set amount = physical_cash_entry,
      notes = format(
        'Venda PDV #%s · recebido em dinheiro R$ %s · troco R$ %s via %s',
        new_sale_id,
        replace(to_char(cash_received_value, 'FM999999990.00'), '.', ','),
        replace(to_char(change_value, 'FM999999990.00'), '.', ','),
        selected_change_method
      )
  where sale_id = new_sale_id and movement_type = 'venda';

  update public.pos_cash_registers
  set expected_amount = public.recalculate_pos_cash_expected(id)
  where id = (select cash_register_id from public.pos_sales where id = new_sale_id);

  return new_sale_id;
end;
$$;

revoke all on function public.create_pos_sale_with_change(
  bigint, text, jsonb, jsonb, numeric, numeric, text, numeric, numeric, text
) from public, anon, authenticated;
grant execute on function public.create_pos_sale_with_change(
  bigint, text, jsonb, jsonb, numeric, numeric, text, numeric, numeric, text
) to authenticated;
