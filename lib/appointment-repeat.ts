import type { Appointment, Service } from "@/types/domain";

export type AppointmentWithServiceNames = Appointment & {
  appointment_services?: Array<{ service_name: string }>;
};

function normalizeServiceName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function uniqueServiceNames(names: string[]) {
  return Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
}

export function getLastCompletedAppointmentServices(
  petId: number,
  appointments: AppointmentWithServiceNames[],
  availableServices: Service[],
) {
  const appointment = appointments
    .filter(
      (item) => Number(item.pet_id) === petId && item.status === "Finalizado",
    )
    .sort((a, b) =>
      `${b.data} ${b.hora} ${String(b.id).padStart(10, "0")}`.localeCompare(
        `${a.data} ${a.hora} ${String(a.id).padStart(10, "0")}`,
      ),
    )[0];

  if (!appointment) {
    return null;
  }

  const performedServices = uniqueServiceNames(
    appointment.appointment_services?.length
      ? appointment.appointment_services.map((item) => item.service_name)
      : appointment.servico.split(/\s+\+\s+/),
  );
  const availableByNormalizedName = new Map(
    availableServices.map((service) => [
      normalizeServiceName(service.nome),
      service.nome,
    ]),
  );
  const selectableServices = uniqueServiceNames(
    performedServices
      .map((name) => availableByNormalizedName.get(normalizeServiceName(name)))
      .filter((name): name is string => Boolean(name)),
  );
  const unavailableServices = performedServices.filter(
    (name) => !availableByNormalizedName.has(normalizeServiceName(name)),
  );

  return {
    appointment,
    performedServices,
    selectableServices,
    unavailableServices,
  };
}
