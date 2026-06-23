import { supabase } from "@/lib/supabase";
import type { NewAppointmentInput } from "@/types/domain";

export async function fetchAppointments() {
  return supabase.from("appointments").select(
    `
      *,
      pets (
        nome
      )
    `,
  );
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

export async function updateAppointmentStatus(id: number, status: string) {
  return supabase.from("appointments").update({ status }).eq("id", id);
}

export async function deleteAppointment(id: number) {
  return supabase.from("appointments").delete().eq("id", id);
}
