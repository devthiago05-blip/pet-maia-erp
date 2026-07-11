-- 030_grooming_function_search_path.sql
-- Define search_path fixo em funcao usada por gatilhos de estoque de insumos.

alter function public.get_grooming_supply_stock_delta(text, numeric)
set search_path = public;
