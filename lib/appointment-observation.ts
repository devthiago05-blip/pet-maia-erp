import type { Appointment } from "@/types/domain";

const autoContactLinePattern = /^(Endereco|Telefone):\s?.*$/i;

export function buildAppointmentObservation(appointment: Appointment) {
  const tutor = appointment.pets?.tutors;
  const observation = appointment.observacao || "";
  const cleanObservation = observation
    .split("\n")
    .filter((line) => !autoContactLinePattern.test(line.trim()))
    .join("\n")
    .trim();
  const contactLines = [
    tutor?.endereco?.trim() ? `Endereco: ${tutor.endereco.trim()}` : "",
    tutor?.telefone?.trim() ? `Telefone: ${tutor.telefone.trim()}` : "",
  ].filter(Boolean);

  return [...contactLines, cleanObservation].filter(Boolean).join("\n");
}

export function formatAppointmentObservation(appointment: Appointment) {
  return buildAppointmentObservation(appointment) || "-";
}
