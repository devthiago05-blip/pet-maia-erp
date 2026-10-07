import type { Appointment } from "@/types/domain";

const autoContactLinePattern = /^(Endere[cç]o|Endereco|Telefone):\s?.*$/i;
const requestedPetLinePattern = /^Pet:\s?(.+)$/i;
const walkInMarkerLinePattern = /^Tipo:\s?Avulso$/i;
const walkInTutorLinePattern = /^Tutor:\s?(.+)$/i;
const walkInPetCountLinePattern = /^Quantidade de c[aã]es:\s?(\d+)$/i;
const phoneLinePattern = /^Telefone:\s?(.+)$/i;

function getObservationLines(observation?: string) {
  return observation?.split("\n").map((line) => line.trim()) || [];
}

function formatDogCount(count?: number) {
  if (!count || count <= 0) {
    return "cães";
  }

  return count === 1 ? "1 cão" : `${count} cães`;
}

export function extractRequestedPetNameFromObservation(observation?: string) {
  return (
    getObservationLines(observation)
      .map((line) => line.match(requestedPetLinePattern)?.[1]?.trim())
      .find(Boolean) || ""
  );
}

export function getWalkInTutorNameFromObservation(observation?: string) {
  return (
    getObservationLines(observation)
      .map((line) => line.match(walkInTutorLinePattern)?.[1]?.trim())
      .find(Boolean) || ""
  );
}

export function getWalkInPetCountFromObservation(observation?: string) {
  const count = getObservationLines(observation)
    .map((line) => Number(line.match(walkInPetCountLinePattern)?.[1] || 0))
    .find((value) => Number.isFinite(value) && value > 0);

  return count || 0;
}

export function getPhoneFromObservation(observation?: string) {
  return (
    getObservationLines(observation)
      .map((line) => line.match(phoneLinePattern)?.[1]?.trim())
      .find(Boolean) || ""
  );
}

export function isWalkInAppointment(
  appointment: Pick<Appointment, "pet_id" | "observacao">,
) {
  const hasWalkInMarker = getObservationLines(appointment.observacao).some(
    (line) => walkInMarkerLinePattern.test(line),
  );

  return (
    hasWalkInMarker ||
    (!appointment.pet_id &&
      Boolean(getWalkInPetCountFromObservation(appointment.observacao)))
  );
}

export function stripWalkInGeneratedObservationLines(observation?: string) {
  return getObservationLines(observation)
    .filter((line) => {
      return (
        line &&
        !walkInMarkerLinePattern.test(line) &&
        !walkInTutorLinePattern.test(line) &&
        !walkInPetCountLinePattern.test(line) &&
        !autoContactLinePattern.test(line)
      );
    })
    .join("\n")
    .trim();
}

export function buildWalkInAppointmentObservation({
  dogCount,
  observation,
  tutor,
  tutorName,
}: {
  dogCount: number;
  observation?: string;
  tutor?: Pick<
    NonNullable<NonNullable<Appointment["pets"]>["tutors"]>,
    "endereco" | "telefone"
  >;
  tutorName: string;
}) {
  const cleanObservation = stripWalkInGeneratedObservationLines(observation);
  const contactLines = [
    tutor?.endereco?.trim() ? `Endereco: ${tutor.endereco.trim()}` : "",
    tutor?.telefone?.trim() ? `Telefone: ${tutor.telefone.trim()}` : "",
  ].filter(Boolean);

  return [
    "Tipo: Avulso",
    `Tutor: ${tutorName.trim()}`,
    `Quantidade de cães: ${Math.max(1, Math.trunc(dogCount))}`,
    ...contactLines,
    cleanObservation,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getAppointmentPetDisplayName(
  appointment: Appointment,
  fallback = "-",
) {
  if (appointment.pets?.nome) {
    return appointment.pets.nome;
  }

  if (isWalkInAppointment(appointment)) {
    const dogCount = getWalkInPetCountFromObservation(appointment.observacao);

    return `Avulso (${formatDogCount(dogCount)})`;
  }

  return (
    extractRequestedPetNameFromObservation(appointment.observacao) || fallback
  );
}

export function getAppointmentTutorDisplayName(
  appointment: Appointment,
  fallback = "-",
) {
  return (
    appointment.pets?.tutors?.nome?.trim() ||
    getWalkInTutorNameFromObservation(appointment.observacao) ||
    fallback
  );
}

export function getAppointmentTutorPhone(appointment: Appointment) {
  return (
    appointment.pets?.tutors?.telefone?.trim() ||
    getPhoneFromObservation(appointment.observacao)
  );
}

export function getAppointmentPetAndTutorDisplayName(
  appointment: Appointment,
  fallback = "-",
) {
  const petName = getAppointmentPetDisplayName(appointment, fallback);
  const tutorName = getAppointmentTutorDisplayName(appointment, "");

  if (!tutorName || petName === fallback) {
    return petName;
  }

  return `${petName} - ${tutorName}`;
}

export function buildAppointmentObservation(appointment: Appointment) {
  const tutor = appointment.pets?.tutors;
  const observation = appointment.observacao || "";

  if (isWalkInAppointment(appointment)) {
    return getObservationLines(observation)
      .filter((line) => line && !walkInMarkerLinePattern.test(line))
      .join("\n")
      .trim();
  }

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
