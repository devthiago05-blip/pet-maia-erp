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
