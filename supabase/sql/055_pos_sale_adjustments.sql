alter table public.user_profiles add column if not exists max_discount_percent numeric(5,2) not null default 10 check (max_discount_percent between 0 and 100);
alter table public.pos_sales add column if not exists subtotal numeric(12,2);
alter table public.pos_sales add column if not exists discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0);
alter table public.pos_sales add column if not exists surcharge_amount numeric(12,2) not null default 0 check (surcharge_amount >= 0);
alter table public.pos_sales add column if not exists adjustment_reason text;
alter table public.pos_sales add column if not exists adjusted_by uuid references public.user_profiles(id) on delete set null;
update public.pos_sales set subtotal = total where subtotal is null;
alter table public.pos_sales alter column subtotal set not null;

create or replace function public.create_pos_sale_adjusted(
  customer_tutor_id bigint, customer_name text, payment_method text, items jsonb,
  selected_discount numeric, selected_surcharge numeric, selected_reason text
) returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare
  new_sale_id bigint; item jsonb; product_record public.products%rowtype;
  calculated_subtotal numeric(12,2) := 0; final_total numeric(12,2);
  discount_value numeric(12,2) := round(greatest(coalesce(selected_discount,0),0),2);
  surcharge_value numeric(12,2) := round(greatest(coalesce(selected_surcharge,0),0),2);
  allowed_percent numeric(5,2);
begin
  if auth.uid() is null or not public.current_user_can_access('pdv') then raise exception 'Acesso negado ao PDV'; end if;
  for item in select * from jsonb_array_elements(items) loop
    select * into product_record from public.products where id=(item->>'product_id')::bigint and ativo=true;
    if not found then raise exception 'Produto inválido'; end if;
    calculated_subtotal := calculated_subtotal + product_record.preco_venda * (item->>'quantidade')::integer;
  end loop;
  select case when is_admin then 100 else max_discount_percent end into allowed_percent from public.user_profiles where id=auth.uid() and ativo=true;
  if allowed_percent is null then raise exception 'Perfil de usuário inválido'; end if;
  if discount_value > round(calculated_subtotal * allowed_percent / 100,2) then raise exception 'Desconto acima do limite de % por cento', allowed_percent; end if;
  final_total := calculated_subtotal - discount_value + surcharge_value;
  if final_total <= 0 then raise exception 'O total da venda precisa ser maior que zero'; end if;

  new_sale_id := public.create_pos_sale(customer_tutor_id, customer_name, payment_method, items);
  update public.pos_sales set subtotal=calculated_subtotal, discount_amount=discount_value, surcharge_amount=surcharge_value,
    adjustment_reason=nullif(trim(selected_reason),''), adjusted_by=case when discount_value>0 or surcharge_value>0 then auth.uid() else null end, total=final_total
  where id=new_sale_id;
  update public.financial_entries set valor=final_total where descricao like format('Venda PDV #%s - %%',new_sale_id);
  update public.pos_cash_movements set amount=final_total where sale_id=new_sale_id and movement_type='venda';
  update public.pos_cash_registers set expected_amount=public.recalculate_pos_cash_expected(id) where id=(select cash_register_id from public.pos_sales where id=new_sale_id);
  return new_sale_id;
end; $$;

create or replace function public.create_pos_sale_with_payments_adjusted(
  customer_tutor_id bigint, customer_name text, items jsonb, payments jsonb,
  selected_discount numeric, selected_surcharge numeric, selected_reason text
) returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare new_sale_id bigint; payment_item jsonb; payment_total numeric(12,2):=0; sale_total numeric(12,2); payment_summary text;
begin
  if payments is null or jsonb_typeof(payments)<>'array' or jsonb_array_length(payments)=0 then raise exception 'Informe ao menos uma forma de pagamento'; end if;
  for payment_item in select * from jsonb_array_elements(payments) loop
    if nullif(trim(payment_item->>'payment_method'),'') is null or (payment_item->>'amount')::numeric<=0 then raise exception 'Pagamento inválido'; end if;
    payment_total:=payment_total+(payment_item->>'amount')::numeric;
  end loop;
  select string_agg(format('%s: R$ %s',trim(item->>'payment_method'),replace(to_char((item->>'amount')::numeric,'FM999999990.00'),'.',',')),' + ')
  into payment_summary from jsonb_array_elements(payments) item;
  new_sale_id:=public.create_pos_sale_adjusted(customer_tutor_id,customer_name,coalesce(payment_summary,'Pagamento dividido'),items,selected_discount,selected_surcharge,selected_reason);
  select total into sale_total from public.pos_sales where id=new_sale_id;
  if round(payment_total,2)<>round(sale_total,2) then raise exception 'Total dos pagamentos diferente do total da venda'; end if;
  for payment_item in select * from jsonb_array_elements(payments) loop
    insert into public.pos_sale_payments(sale_id,payment_method,amount) values(new_sale_id,trim(payment_item->>'payment_method'),(payment_item->>'amount')::numeric);
  end loop;
  return new_sale_id;
end; $$;

revoke all on function public.create_pos_sale_adjusted(bigint,text,text,jsonb,numeric,numeric,text) from public,anon,authenticated;
revoke all on function public.create_pos_sale_with_payments_adjusted(bigint,text,jsonb,jsonb,numeric,numeric,text) from public,anon,authenticated;
grant execute on function public.create_pos_sale_adjusted(bigint,text,text,jsonb,numeric,numeric,text) to authenticated;
grant execute on function public.create_pos_sale_with_payments_adjusted(bigint,text,jsonb,jsonb,numeric,numeric,text) to authenticated;
