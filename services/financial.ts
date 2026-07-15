import { isGroomerDailyPaymentOrigin } from "@/lib/financial-origin";
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

export async function fetchFinancialEntriesByPet(petId: number) {
  return supabase
    .from("financial_entries")
    .select(financialEntrySelect)
    .eq("pet_id", petId)
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
      data_vencimento:
        entry.tipo === "Despesa" ? entry.dataVencimento || null : null,
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
  petId?: number,
  tutorId?: number,
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
      pet_id: petId ?? null,
      tutor_id: tutorId ?? null,
    },
  ]);
}

async function syncLinkedPaymentStatus(
  origin: string | null | undefined,
  referenceId: number | null | undefined,
  financialEntryId: number,
) {
  const filters = [`financial_entry_id.eq.${financialEntryId}`];

  if (referenceId) {
    filters.push(`id.eq.${referenceId}`);
  }

  if (origin === "groomer_daily_payment") {
    return supabase
      .from("groomer_daily_payments")
      .update({ payment_status: "Pago" })
      .or(filters.join(","));
  }

  if (origin === "grooming_supply") {
    return supabase
      .from("grooming_supply_movements")
      .update({ payment_status: "Pago" })
      .or(filters.join(","));
  }

  if (origin === "grooming_equipment_service") {
    return supabase
      .from("grooming_equipment_services")
      .update({ payment_status: "Pago" })
      .or(filters.join(","));
  }

  return { error: null };
}

export async function markFinancialEntryAsPaid(id: number) {
  const entryResponse = await supabase
    .from("financial_entries")
    .select("origem, referencia_id")
    .eq("id", id)
    .single();

  if (entryResponse.error) {
    return entryResponse;
  }

  const paymentResponse = await supabase
    .from("financial_entries")
    .update({ status_pagamento: "Pago" })
    .eq("id", id);

  if (paymentResponse.error) {
    return paymentResponse;
  }

  const syncResponse = await syncLinkedPaymentStatus(
    entryResponse.data?.origem,
    entryResponse.data?.referencia_id,
    id,
  );

  if (syncResponse.error) {
    return syncResponse;
  }

  return paymentResponse;
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
  const currentEntryResponse = await supabase
    .from("financial_entries")
    .select("origem, referencia_id")
    .eq("id", id)
    .single();

  if (currentEntryResponse.error) {
    return currentEntryResponse;
  }

  const effectiveType = isGroomerDailyPaymentOrigin(
    currentEntryResponse.data?.origem,
  )
    ? "Despesa"
    : entry.tipo;

  const updateResponse = await supabase
    .from("financial_entries")
    .update({
      descricao: entry.descricao.trim(),
      valor: entry.valor,
      tipo: effectiveType,
      forma_pagamento: entry.formaPagamento,
      status_pagamento: entry.statusPagamento,
      data_vencimento:
        effectiveType === "Despesa" ? entry.dataVencimento || null : null,
      tutor_id: entry.tutorId ? Number(entry.tutorId) : null,
      pet_id: entry.petId ? Number(entry.petId) : null,
    })
    .eq("id", id);

  if (updateResponse.error || entry.statusPagamento !== "Pago") {
    return updateResponse;
  }

  const syncResponse = await syncLinkedPaymentStatus(
    currentEntryResponse.data?.origem,
    currentEntryResponse.data?.referencia_id,
    id,
  );

  if (syncResponse.error) {
    return syncResponse;
  }

  return updateResponse;
}
