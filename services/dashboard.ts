import { supabase } from "@/lib/supabase";

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMondayToSundayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    endDate: formatDateOnly(end),
    startDate: formatDateOnly(start),
  };
}

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
  const { endDate, startDate } = getCurrentMondayToSundayRange();

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
    .gte("data", startDate)
    .lte("data", endDate)
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
}

export async function fetchWeeklyAppointmentsByStatus(status: string) {
  const { endDate, startDate } = getCurrentMondayToSundayRange();

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
    .gte("data", startDate)
    .lte("data", endDate)
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
}

export async function fetchPendingAppointmentRequests() {
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
    .eq("status", "Pendente")
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
}

export async function fetchOverdueOpenAppointments() {
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
    .lt("data", formatDateOnly(new Date()))
    .neq("status", "Finalizado")
    .neq("status", "Cancelado")
    .order("data", { ascending: true })
    .order("hora", { ascending: true })
    .limit(20);
}
export async function fetchPetsForBathReminders() {
  return supabase
    .from("pets")
    .select(
      `
      id,
      nome,
      tutor_id,
      bath_reminder_interval_days,
      bath_reminder_dismissed_until,
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
