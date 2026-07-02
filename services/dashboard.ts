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

  inicioSemana.setDate(
    inicioSemana.getDate() - inicioSemana.getDay(),
  );

  inicioSemana.setHours(0, 0, 0, 0);

  return supabase
    .from("appointments")
    .select("*")
    .gte("data", inicioSemana.toISOString().split("T")[0]);
}

export async function fetchWeeklyAppointmentsByStatus(
  status: string,
) {
  const inicioSemana = new Date();

  inicioSemana.setDate(
    inicioSemana.getDate() - inicioSemana.getDay(),
  );

  inicioSemana.setHours(0, 0, 0, 0);

  return supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("status", status)
    .gte("data", inicioSemana.toISOString().split("T")[0]);
}