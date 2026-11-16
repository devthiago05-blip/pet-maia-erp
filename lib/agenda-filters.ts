import type { Appointment } from "@/types/domain";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filterAgendaAppointments<T extends Appointment>(
  appointments: T[],
  filterStatus: string,
  startDate: string,
  endDate: string,
  search: string,
): T[] {
  const term = normalizeText(search);

  return appointments.filter((appointment) => {
    const matchesSearch =
      !term ||
      normalizeText(appointment.pets?.nome || "").includes(term) ||
      normalizeText(appointment.pets?.tutors?.nome || "").includes(term) ||
      normalizeText(appointment.servico).includes(term) ||
      normalizeText(appointment.observacao || "").includes(term);

    const matchesDate =
      filterStatus === "Agendado" ||
      ((!startDate || appointment.data >= startDate) &&
        (!endDate || appointment.data <= endDate));

    const matchesStatus =
      filterStatus === "Todos" || appointment.status === filterStatus;

    return matchesSearch && matchesDate && matchesStatus;
  });
}
