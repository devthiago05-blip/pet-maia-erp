alter table public.products
  add column if not exists purchase_unit text not null default 'UN',
  add column if not exists sale_unit text not null default 'UN',
  add column if not exists units_per_purchase integer not null default 1;

update public.products
set sale_unit = coalesce(nullif(unidade_comercial, ''), 'UN')
where sale_unit = 'UN';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_units_per_purchase_positive'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_units_per_purchase_positive
      check (units_per_purchase >= 1);
  end if;
end $$;

create or replace function public.create_product_purchase(
  selected_supplier_id bigint,
  document_number text,
  purchase_date date,
  due_date date,
  payment_method text,
  notes text,
  items jsonb
) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  new_purchase_id bigint; new_financial_entry_id bigint;
  purchase_total numeric(12,2) := 0; item jsonb;
  selected_product public.products%rowtype; selected_supplier public.suppliers%rowtype;
  item_quantity integer; item_cost numeric(12,2); stock_units integer;
begin
  if auth.uid() is null or not public.current_user_can_access('pdv') then raise exception 'Acesso negado ao PDV'; end if;
  select * into selected_supplier from public.suppliers where id=selected_supplier_id and ativo=true;
  if not found then raise exception 'Fornecedor inválido'; end if;
  if items is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items)=0 then raise exception 'A compra precisa ter ao menos um item'; end if;
  for item in select * from jsonb_array_elements(items) loop
    select * into selected_product from public.products where id=(item->>'product_id')::bigint for update;
    if not found then raise exception 'Produto inválido'; end if;
    item_quantity := (item->>'quantidade')::integer; item_cost := (item->>'custo_unitario')::numeric;
    if item_quantity<=0 or item_cost<0 then raise exception 'Quantidade ou custo inválido'; end if;
    purchase_total := purchase_total + item_quantity*item_cost;
  end loop;
  insert into public.financial_entries(descricao,valor,tipo,forma_pagamento,status_pagamento,data_vencimento,origem)
  values(format('Compra de produtos - %s%s',selected_supplier.nome,case when nullif(trim(document_number),'') is null then '' else format(' - Documento %s',trim(document_number)) end),purchase_total,'Despesa',nullif(trim(payment_method),''),'Pendente',coalesce(due_date,purchase_date,current_date),'Compra PDV') returning id into new_financial_entry_id;
  insert into public.product_purchases(supplier_id,numero_documento,data_compra,data_vencimento,forma_pagamento,total,observacao,financial_entry_id)
  values(selected_supplier_id,nullif(trim(document_number),''),coalesce(purchase_date,current_date),coalesce(due_date,purchase_date,current_date),nullif(trim(payment_method),''),purchase_total,nullif(trim(notes),''),new_financial_entry_id) returning id into new_purchase_id;
  update public.financial_entries set referencia_id=new_purchase_id where id=new_financial_entry_id;
  for item in select * from jsonb_array_elements(items) loop
    select * into selected_product from public.products where id=(item->>'product_id')::bigint for update;
    item_quantity := (item->>'quantidade')::integer; item_cost := (item->>'custo_unitario')::numeric;
    stock_units := item_quantity*greatest(selected_product.units_per_purchase,1);
    insert into public.product_purchase_items(purchase_id,product_id,quantidade,custo_unitario,subtotal)
    values(new_purchase_id,selected_product.id,item_quantity,item_cost,item_quantity*item_cost);
    perform set_config('pet_maia.stock_kind','entrada',true);
    perform set_config('pet_maia.stock_reason',format('Compra #%s: %s %s = %s %s',new_purchase_id,item_quantity,selected_product.purchase_unit,stock_units,selected_product.sale_unit),true);
    update public.products set estoque=estoque+stock_units,stock_quantity=estoque+stock_units,preco_custo=item_cost/greatest(units_per_purchase,1),updated_at=now() where id=selected_product.id;
  end loop;
  return new_purchase_id;
end; $$;

create or replace function public.receive_purchase_order(selected_order_id bigint, receipts jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare selected_order public.purchase_orders%rowtype; receipt jsonb; selected_item public.purchase_order_items%rowtype; selected_product public.products%rowtype; receive_qty integer; stock_units integer; pending_count integer;
begin
  if auth.uid() is null or not public.current_user_can_access('pdv') then raise exception 'Acesso negado ao PDV'; end if;
  select * into selected_order from public.purchase_orders where id=selected_order_id for update;
  if not found or selected_order.status in ('Concluído','Cancelado') then raise exception 'Pedido não disponível para recebimento'; end if;
  if receipts is null or jsonb_typeof(receipts)<>'array' or jsonb_array_length(receipts)=0 then raise exception 'Informe as quantidades recebidas'; end if;
  for receipt in select * from jsonb_array_elements(receipts) loop
    select * into selected_item from public.purchase_order_items where id=(receipt->>'item_id')::bigint and order_id=selected_order_id for update;
    receive_qty := (receipt->>'quantidade')::integer;
    if not found or receive_qty<=0 or selected_item.received_quantity+receive_qty>selected_item.ordered_quantity then raise exception 'Quantidade recebida inválida'; end if;
    select * into selected_product from public.products where id=selected_item.product_id for update;
    stock_units := receive_qty*greatest(selected_product.units_per_purchase,1);
    update public.purchase_order_items set received_quantity=received_quantity+receive_qty where id=selected_item.id;
    perform set_config('pet_maia.stock_kind','entrada',true);
    perform set_config('pet_maia.stock_reason',format('Pedido #%s: %s %s = %s %s',selected_order_id,receive_qty,selected_product.purchase_unit,stock_units,selected_product.sale_unit),true);
    update public.products set estoque=estoque+stock_units,stock_quantity=estoque+stock_units,preco_custo=selected_item.unit_cost/greatest(units_per_purchase,1),updated_at=now() where id=selected_item.product_id;
  end loop;
  select count(*) into pending_count from public.purchase_order_items where order_id=selected_order_id and received_quantity<ordered_quantity;
  update public.purchase_orders set status=case when pending_count=0 then 'Concluído' else 'Recebido parcialmente' end,updated_at=now() where id=selected_order_id;
end; $$;

revoke all on function public.create_product_purchase(bigint,text,date,date,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.receive_purchase_order(bigint,jsonb) from public,anon,authenticated;
grant execute on function public.create_product_purchase(bigint,text,date,date,text,text,jsonb) to authenticated;
grant execute on function public.receive_purchase_order(bigint,jsonb) to authenticated;
