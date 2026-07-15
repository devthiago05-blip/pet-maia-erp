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
