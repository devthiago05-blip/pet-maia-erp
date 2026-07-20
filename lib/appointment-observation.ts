import type { Appointment } from "@/types/domain";

const autoContactLinePattern = /^(Endereco|Telefone):\s?.*$/i;
const requestedPetLinePattern = /^Pet:\s?(.+)$/i;

export function extractRequestedPetNameFromObservation(observation?: string) {
  return (
    observation
      ?.split("\n")
      .map((line) => line.trim().match(requestedPetLinePattern)?.[1]?.trim())
      .find(Boolean) || ""
  );
}

export function getAppointmentPetDisplayName(
  appointment: Appointment,
  fallback = "-",
) {
  return (
    appointment.pets?.nome ||
    extractRequestedPetNameFromObservation(appointment.observacao) ||
    fallback
  );
}

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
