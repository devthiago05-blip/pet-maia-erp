import { supabase } from "@/lib/supabase";
import type { NewFinancialEntryInput } from "@/types/domain";

export async function fetchFinancialEntries() {
  return supabase
    .from("financial_entries")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function fetchRecentFinancialEntries() {
  return supabase
    .from("financial_entries")
    .select("*")
    .order("id", { ascending: false })
    .limit(5);
}

export async function fetchPaidRevenueValues() {
  return supabase
    .from("financial_entries")
    .select("valor")
    .eq("status_pagamento", "Pago")
    .eq("tipo", "Receita");
}

export async function fetchPendingRevenueValues() {
  return supabase
    .from("financial_entries")
    .select("valor")
    .eq("status_pagamento", "Pendente")
    .eq("tipo", "Receita");
}

export async function createFinancialEntry(entry: NewFinancialEntryInput) {
  return supabase.from("financial_entries").insert([
    {
      descricao: entry.descricao,
      valor: entry.valor,
      tipo: entry.tipo,
      forma_pagamento: entry.formaPagamento,
      status_pagamento: "Pendente",
    },
  ]);
}

export async function createAppointmentFinancialEntry(
  petName: string,
  valor: number,
  formaPagamento: string,
) {
  return supabase.from("financial_entries").insert([
    {
      descricao: `Consulta - ${petName}`,
      valor,
      tipo: "Receita",
      forma_pagamento: formaPagamento,
      status_pagamento: "Pendente",
    },
  ]);
}

export async function markFinancialEntryAsPaid(id: number) {
  return supabase
    .from("financial_entries")
    .update({ status_pagamento: "Pago" })
    .eq("id", id);
}

export async function deleteFinancialEntry(id: number) {
  return supabase.from("financial_entries").delete().eq("id", id);
}
