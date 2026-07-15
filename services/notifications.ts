import { supabase } from "@/lib/supabase";

export async function fetchTodayPendingAppointments(date: string) {
  return supabase
    .from("appointments")
    .select(
      `
        id,
        hora,
        servico,
        pets (
          nome
        )
      `,
    )
    .eq("data", date)
    .eq("status", "Agendado")
    .order("hora");
}

export async function fetchPendingSiteAppointmentNotifications() {
  return supabase
    .from("appointments")
    .select(
      `
        id,
        data,
        hora,
        servico,
        pets (
          nome,
          tutors!pets_tutor_id_fkey (
            nome
          )
        )
      `,
    )
    .eq("status", "Pendente")
    .order("data", { ascending: true })
    .order("hora", { ascending: true })
    .limit(10);
}

export async function fetchPendingFinancialNotifications() {
  return supabase
    .from("financial_entries")
    .select("id, descricao, valor")
    .eq("tipo", "Receita")
    .eq("status_pagamento", "Pendente")
    .order("created_at", { ascending: false })
    .limit(5);
}

export async function fetchVaccinationNotifications(
  startDate: string,
  endDate: string,
) {
  return supabase
    .from("pet_vaccinations")
    .select(
      `
        id,
        pet_id,
        vaccine_name,
        next_dose_date,
        pets (
          nome,
          tutors!pets_tutor_id_fkey (
            nome
          )
        )
      `,
    )
    .not("next_dose_date", "is", null)
    .gte("next_dose_date", startDate)
    .lte("next_dose_date", endDate)
    .order("next_dose_date", { ascending: true })
    .limit(20);
}
