import { supabase } from "@/lib/supabase";
import type {
  AppointmentService,
  AppointmentStatus,
  CompletedAppointmentService,
  NewAppointmentInput,
} from "@/types/domain";

export async function fetchAppointments() {
  return supabase.from("appointments").select(
    `
      *,
      pets (
        nome,
        porte,
        photo_url,
        tutor_id,
        tutors!pets_tutor_id_fkey (
          id,
          nome,
          telefone,
          endereco
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
      observacao: appointment.observacao?.trim() || null,
    },
  ]);
}

export async function updateAppointment(
  id: number,
  appointment: NewAppointmentInput,
  petId: number,
) {
  return supabase
    .from("appointments")
    .update({
      pet_id: petId,
      servico: appointment.servico,
      data: appointment.data,
      hora: appointment.hora,
      status: appointment.status,
      observacao: appointment.observacao?.trim() || null,
    })
    .eq("id", id);
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus,
) {
  return supabase.from("appointments").update({ status }).eq("id", id);
}

export async function updateAppointmentTime(id: number, hora: string) {
  return supabase.from("appointments").update({ hora }).eq("id", id);
}

export async function deleteAppointment(id: number) {
  return supabase.from("appointments").delete().eq("id", id);
}
export async function replaceAppointmentServices(
  appointmentId: number,
  services: CompletedAppointmentService[],
) {
  const { error: deleteError } = await supabase
    .from("appointment_services")
    .delete()
    .eq("appointment_id", appointmentId);

  if (deleteError) {
    return {
      data: null,
      error: deleteError,
    };
  }

  if (services.length === 0) {
    return {
      data: null,
      error: null,
    };
  }

  return supabase.from("appointment_services").insert(
    services.map((service) => ({
      appointment_id: appointmentId,
      service_name: service.serviceName,
      price: service.price,
    })),
  );
}

export async function deleteAppointmentServicesByAppointmentId(
  appointmentId: number,
) {
  return supabase
    .from("appointment_services")
    .delete()
    .eq("appointment_id", appointmentId);
}
export async function fetchAppointmentServicesByAppointmentId(
  appointmentId: number,
) {
  return supabase
    .from("appointment_services")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("id", { ascending: true })
    .returns<AppointmentService[]>();
}
