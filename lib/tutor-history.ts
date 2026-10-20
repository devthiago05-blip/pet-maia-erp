import type { AccessModule } from "@/lib/access-control";
import type {
  Appointment,
  AppointmentService,
  FinancialEntry,
} from "@/types/domain";

export const NOT_INFORMED = "Não informado";

export type TutorHistoryAppointment = Appointment & {
  appointment_services?: AppointmentService[];
};

export function tutorHistoryAccess(
  canAccess: (module: AccessModule) => boolean,
) {
  return {
    history: ["agenda", "dashboard", "pets", "clinica"].some((module) =>
      canAccess(module as AccessModule),
    ),
    services: ["agenda", "financeiro", "recibos"].some((module) =>
      canAccess(module as AccessModule),
    ),
    financial: canAccess("financeiro") || canAccess("dashboard"),
  };
}

export function historyText(value: string | null | undefined) {
  return value?.trim() || NOT_INFORMED;
}

function recordedNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function sortTutorHistory(appointments: TutorHistoryAppointment[]) {
  return [...appointments].sort(
    (a, b) =>
      `${b.data || ""} ${b.hora || ""}`.localeCompare(
        `${a.data || ""} ${a.hora || ""}`,
      ) || b.id - a.id,
  );
}

export function appointmentValue(
  appointment: TutorHistoryAppointment,
  financialEntries: FinancialEntry[],
) {
  // Match the receipt flow: use the latest linked revenue, never today's price list.
  const entry = financialEntries
    .filter(
      (item) =>
        item.origem === "appointment" &&
        item.tipo === "Receita" &&
        item.referencia_id === appointment.id,
    )
    .sort((a, b) => b.id - a.id)[0];
  if (entry) return recordedNumber(entry.valor);
  const services = appointment.appointment_services || [];
  if (
    !services.length ||
    services.some((item) => recordedNumber(item.price) === null)
  )
    return null;
  return services.reduce((total, item) => total + Number(item.price), 0);
}

export function lastCompletedBath(
  appointments: TutorHistoryAppointment[],
  petId: number,
) {
  return sortTutorHistory(appointments).find((appointment) => {
    if (appointment.pet_id !== petId || appointment.status !== "Finalizado")
      return false;
    const services = appointment.appointment_services || [];
    const description = services.length
      ? services.map((item) => item.service_name).join(" ")
      : appointment.servico || "";
    return /\bbanhos?\b/i.test(
      description.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    );
  });
}

export function completedHistoryTotal(
  appointments: TutorHistoryAppointment[],
  financialEntries: FinancialEntry[],
) {
  let total = 0;
  let known = 0;
  let missing = 0;
  for (const appointment of appointments) {
    if (appointment.status !== "Finalizado") continue;
    const value = appointmentValue(appointment, financialEntries);
    if (value === null) missing++;
    else {
      known++;
      total += Math.round(value * 100);
    }
  }
  return { total: total / 100, known, missing };
}
