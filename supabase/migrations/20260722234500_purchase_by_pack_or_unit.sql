alter table public.product_purchase_items
  add column if not exists purchase_multiplier integer not null default 1;

alter table public.product_purchase_items
  drop constraint if exists product_purchase_items_purchase_multiplier_positive;
alter table public.product_purchase_items
  add constraint product_purchase_items_purchase_multiplier_positive
  check (purchase_multiplier >= 1);

create or replace function public.create_product_purchase_split(
  selected_supplier_id bigint,
  document_number text,
  purchase_date date,
  due_date date,
  payments jsonb,
  notes text,
  items jsonb
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  selected_supplier public.suppliers%rowtype; selected_product public.products%rowtype;
  new_purchase_id bigint; new_financial_entry_id bigint; first_financial_entry_id bigint;
  item jsonb; payment jsonb; item_quantity integer; item_cost numeric; stock_units integer;
  item_multiplier integer; payment_method text; payment_amount numeric; items_total numeric; payments_total numeric;
begin
  if auth.uid() is null or not public.current_user_can_access('pdv') then raise exception 'Acesso negado ao PDV'; end if;
  select * into selected_supplier from public.suppliers where id=selected_supplier_id and ativo=true;
  if not found then raise exception 'Fornecedor não encontrado'; end if;
  select coalesce(sum((value->>'quantidade')::integer*(value->>'custo_unitario')::numeric),0) into items_total from jsonb_array_elements(items);
  select coalesce(sum((value->>'amount')::numeric),0) into payments_total from jsonb_array_elements(payments);
  if abs(items_total-payments_total)>0.009 then raise exception 'A soma dos pagamentos deve ser igual ao total da compra'; end if;
  insert into public.product_purchases(supplier_id,numero_documento,data_compra,data_vencimento,forma_pagamento,observacoes,valor_total)
  values(selected_supplier_id,nullif(trim(document_number),''),coalesce(purchase_date,current_date),coalesce(due_date,purchase_date,current_date),coalesce(payments->0->>'payment_method','Outros'),nullif(trim(notes),''),items_total) returning id into new_purchase_id;
  for payment in select * from jsonb_array_elements(payments) loop
    payment_method:=payment->>'payment_method'; payment_amount:=round((payment->>'amount')::numeric,2);
    insert into public.financial_entries(descricao,valor,tipo,forma_pagamento,status_pagamento,data_vencimento,origem,referencia_id)
    values(format('Compra de produtos #%s - %s%s',new_purchase_id,selected_supplier.nome,case when nullif(trim(document_number),'') is null then '' else format(' - Documento %s',trim(document_number)) end),payment_amount,'Despesa',payment_method,'Pendente',coalesce(due_date,purchase_date,current_date),'Compra PDV',new_purchase_id) returning id into new_financial_entry_id;
    if first_financial_entry_id is null then first_financial_entry_id:=new_financial_entry_id; end if;
    insert into public.product_purchase_payments(purchase_id,financial_entry_id,payment_method,amount,due_date) values(new_purchase_id,new_financial_entry_id,payment_method,payment_amount,coalesce(due_date,purchase_date,current_date));
  end loop;
  update public.product_purchases set financial_entry_id=first_financial_entry_id where id=new_purchase_id;
  for item in select * from jsonb_array_elements(items) loop
    select * into selected_product from public.products where id=(item->>'product_id')::bigint for update;
    item_quantity:=(item->>'quantidade')::integer; item_cost:=(item->>'custo_unitario')::numeric;
    item_multiplier:=greatest(coalesce((item->>'multiplicador')::integer,selected_product.units_per_purchase,1),1);
    stock_units:=item_quantity*item_multiplier;
    insert into public.product_purchase_items(purchase_id,product_id,quantidade,custo_unitario,subtotal,purchase_multiplier)
    values(new_purchase_id,selected_product.id,item_quantity,item_cost,item_quantity*item_cost,item_multiplier);
    perform set_config('pet_maia.stock_kind','entrada',true);
    perform set_config('pet_maia.stock_reason',format('Compra #%s: %s x %s = %s %s',new_purchase_id,item_quantity,item_multiplier,stock_units,selected_product.sale_unit),true);
    update public.products set estoque=estoque+stock_units,stock_quantity=estoque+stock_units,preco_custo=item_cost/item_multiplier,updated_at=now() where id=selected_product.id;
  end loop;
  return new_purchase_id;
end; $$;

revoke all on function public.create_product_purchase_split(bigint,text,date,date,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_product_purchase_split(bigint,text,date,date,jsonb,text,jsonb) to authenticated;

-- Compras anteriores foram feitas pela apresentação padrão do produto.
update public.product_purchase_items item
set purchase_multiplier=greatest(coalesce(product.units_per_purchase,1),1)
from public.products product
where product.id=item.product_id and item.purchase_multiplier=1;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.delete_product_purchase(bigint)'::regprocedure)
  into function_definition;
  function_definition := replace(
    function_definition,
    'greatest(coalesce(product.units_per_purchase, 1), 1)',
    'greatest(coalesce(purchase_item.purchase_multiplier, product.units_per_purchase, 1), 1)'
  );
  execute function_definition;
end;
$$;
