import type { FinancialEntry, FinancialEntryType } from "@/types/domain";

const groomerDailyPaymentOrigins = new Set([
  "grooming_daily_payment",
  "groomer_daily_payment",
]);

export function getFinancialOriginLabel(origin?: string) {
  const labels: Record<string, string> = {
    appointment: "Agenda",
    grooming_daily_payment: "Diaria tosador",
    groomer_daily_payment: "Diaria tosador",
    grooming_equipment_service: "Manutencao/Afiacao",
    grooming_supply: "Insumos",
    manual: "Manual",
    pdv: "PDV",
    pos: "PDV",
  };

  return labels[origin || "manual"] || origin || "Manual";
}

export function isGroomerDailyPaymentOrigin(origin?: string | null) {
  return groomerDailyPaymentOrigins.has(origin || "");
}

export function getEffectiveFinancialEntryType(
  entry: Pick<FinancialEntry, "origem" | "tipo">,
): FinancialEntryType {
  if (isGroomerDailyPaymentOrigin(entry.origem)) {
    return "Despesa";
  }

  return entry.tipo || "Receita";
}
