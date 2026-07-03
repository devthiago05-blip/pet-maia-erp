import { supabase } from "@/lib/supabase";

export async function fetchDashboardCounts() {
  const [pets, tutors, appointments] = await Promise.all([
    supabase.from("pets").select("*", { count: "exact", head: true }),
    supabase.from("tutors").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
  ]);

  return {
    appointmentsCount: appointments.count || 0,
    petsCount: pets.count || 0,
    tutorsCount: tutors.count || 0,
  };
}

export async function fetchRecentAppointments() {
  return supabase
    .from("appointments")
    .select(
      `
      *,
      pets (
        nome
      )
    `,
    )
    .order("id", { ascending: false })
    .limit(5);
}


export async function fetchWeeklyAppointments() {
  const inicioSemana = new Date();

  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  return supabase
    .from("appointments")
    .select(
      `
      *,
      pets (
        nome,
        porte,
        tutors (
          nome,
          telefone
        )
      )
    `,
    )
    .gte("data", inicioSemana.toISOString().split("T")[0])
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
}

export async function fetchWeeklyAppointmentsByStatus(status: string) {
  const inicioSemana = new Date();

  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  return supabase
    .from("appointments")
    .select(
      `
      *,
      pets (
        nome,
        porte,
        tutors (
          nome,
          telefone
        )
      )
    `,
    )
    .eq("status", status)
    .gte("data", inicioSemana.toISOString().split("T")[0])
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
}
export async function fetchPetsForBathReminders() {
  return supabase
    .from("pets")
    .select(
      `
      id,
      nome,
      tutors (
        nome,
        telefone
      )
    `,
    )
    .order("nome", { ascending: true });
}

export async function fetchFinalizedBathAppointmentsForReminders() {
  return supabase
    .from("appointments")
    .select(
      `
      id,
      pet_id,
      servico,
      data,
      hora,
      status,
      pets (
        nome,
        porte,
        tutors (
          nome,
          telefone
        )
      )
    `,
    )
    .eq("status", "Finalizado")
    .ilike("servico", "%banho%")
    .not("pet_id", "is", null)
    .order("data", { ascending: false });
}