import { supabase } from "@/lib/supabase";
import type { AppointmentStatus, NewAppointmentInput } from "@/types/domain";

export async function fetchAppointments() {
  return supabase.from("appointments").select(
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
  );
}

export async function fetchAppointmentsByPet(petId: number) {
  return supabase
    .from("appointments")
    .select("*")
    .eq("pet_id", petId)
    .order("data", { ascending: false })
    .order("hora", { ascending: false });
}

export async function createAppointment(
  appointment: NewAppointmentInput,
  petId: number,
) {
  return supabase.from("appointments").insert([
    {
      pet_id: petId,
      servico: appointment.servico,
      data: appointment.data,
      hora: appointment.hora,
      status: appointment.status,
    },
  ]);
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus,
) {
  return supabase.from("appointments").update({ status }).eq("id", id);
}

export async function deleteAppointment(id: number) {
  return supabase.from("appointments").delete().eq("id", id);
}
