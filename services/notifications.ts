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

export async function fetchPendingFinancialNotifications() {
  return supabase
    .from("financial_entries")
    .select("id, descricao, valor")
    .eq("tipo", "Receita")
    .eq("status_pagamento", "Pendente")
    .order("created_at", { ascending: false })
    .limit(5);
}
