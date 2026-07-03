import { supabase } from "@/lib/supabase";
import type {
  NewFinancialEntryInput,
  UpdateFinancialEntryInput,
} from "@/types/domain";

const financialEntrySelect = `
  *,
  tutors (
    nome
  ),
  pets (
    nome
  )
`;

export async function fetchFinancialEntries() {
  return supabase
    .from("financial_entries")
    .select(financialEntrySelect)
    .order("created_at", { ascending: false });
}

export async function fetchRecentFinancialEntries() {
  return supabase
    .from("financial_entries")
    .select(financialEntrySelect)
    .order("id", { ascending: false })
    .limit(5);
}

export async function fetchFinancialEntriesByPet(petName: string) {
  return supabase
    .from("financial_entries")
    .select(financialEntrySelect)
    .or(`pets.nome.ilike.%${petName}%,descricao.ilike.% - ${petName}`)
    .order("created_at", { ascending: false });
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
      descricao: entry.descricao.trim(),
      valor: entry.valor,
      tipo: entry.tipo,
      forma_pagamento: entry.formaPagamento,
      status_pagamento: entry.statusPagamento || "Pendente",
      data_vencimento: entry.dataVencimento || null,
      origem: "manual",
      tutor_id: entry.tutorId ? Number(entry.tutorId) : null,
      pet_id: entry.petId ? Number(entry.petId) : null,
    },
  ]);
}

export async function createAppointmentFinancialEntry(
  appointmentId: number,
  petName: string,
  serviceDescription: string,
  valor: number,
  formaPagamento: string,
) {
  return supabase.from("financial_entries").insert([
    {
      descricao: `${serviceDescription} - ${petName}`,
      valor,
      tipo: "Receita",
      forma_pagamento: formaPagamento,
      status_pagamento: "Pendente",
      origem: "appointment",
      referencia_id: appointmentId,
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

export async function deleteFinancialEntriesByAppointmentId(
  appointmentId: number,
) {
  return supabase
    .from("financial_entries")
    .delete()
    .eq("origem", "appointment")
    .eq("referencia_id", appointmentId);
}
export async function fetchFinancialEntriesByAppointmentId(
  appointmentId: number,
) {
  return supabase
    .from("financial_entries")
    .select(financialEntrySelect)
    .eq("origem", "appointment")
    .eq("referencia_id", appointmentId)
    .order("id", { ascending: false })
    .limit(1);
}

export async function fetchWeeklyPaidRevenue() {
  const inicioSemana = new Date();

  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  return supabase
    .from("financial_entries")
    .select(financialEntrySelect)
    .eq("status_pagamento", "Pago")
    .eq("tipo", "Receita")
    .gte("created_at", inicioSemana.toISOString());
}

export async function fetchWeeklyPendingRevenue() {
  const inicioSemana = new Date();

  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  return supabase
    .from("financial_entries")
    .select(financialEntrySelect)
    .eq("status_pagamento", "Pendente")
    .eq("tipo", "Receita")
    .gte("created_at", inicioSemana.toISOString());
}

export async function updateFinancialEntry(
  id: number,
  entry: UpdateFinancialEntryInput,
) {
  return supabase
    .from("financial_entries")
    .update({
      descricao: entry.descricao.trim(),
      valor: entry.valor,
      tipo: entry.tipo,
      forma_pagamento: entry.formaPagamento,
      status_pagamento: entry.statusPagamento,
      data_vencimento: entry.dataVencimento || null,
      tutor_id: entry.tutorId ? Number(entry.tutorId) : null,
      pet_id: entry.petId ? Number(entry.petId) : null,
    })
    .eq("id", id);
}