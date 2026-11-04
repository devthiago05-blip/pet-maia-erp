import { describe, expect, it } from "vitest";

import {
  type AppointmentWithServiceNames,
  getLastCompletedAppointmentServices,
} from "@/lib/appointment-repeat";
import type { Appointment, Service } from "@/types/domain";

const services = [
  { id: 1, nome: "Banho", preco_pequeno: 0, preco_medio: 0, preco_grande: 0 },
  { id: 2, nome: "Tosa", preco_pequeno: 0, preco_medio: 0, preco_grande: 0 },
] satisfies Service[];

function appointment(
  input: Partial<AppointmentWithServiceNames> &
    Pick<Appointment, "id" | "data" | "servico">,
): AppointmentWithServiceNames {
  return {
    hora: "10:00",
    pet_id: 7,
    status: "Finalizado",
    ...input,
  };
}

describe("getLastCompletedAppointmentServices", () => {
  it("usa os serviços efetivamente realizados do atendimento mais recente", () => {
    const result = getLastCompletedAppointmentServices(
      7,
      [
        appointment({ id: 1, data: "2026-10-01", servico: "Banho" }),
        appointment({
          id: 2,
          data: "2026-11-01",
          servico: "Banho",
          appointment_services: [
            { service_name: "Banho" },
            { service_name: "Tosa" },
          ],
        }),
      ],
      services,
    );

    expect(result?.appointment.id).toBe(2);
    expect(result?.selectableServices).toEqual(["Banho", "Tosa"]);
  });

  it("ignora cancelados, outros pets e informa serviços indisponíveis", () => {
    const result = getLastCompletedAppointmentServices(
      7,
      [
        appointment({
          id: 3,
          data: "2026-11-03",
          servico: "Banho",
          status: "Cancelado",
        }),
        appointment({
          id: 4,
          data: "2026-11-02",
          pet_id: 8,
          servico: "Banho",
        }),
        appointment({
          id: 2,
          data: "2026-11-01",
          servico: "Banho + Hidratação",
        }),
      ],
      services,
    );

    expect(result?.appointment.id).toBe(2);
    expect(result?.selectableServices).toEqual(["Banho"]);
    expect(result?.unavailableServices).toEqual(["Hidratação"]);
  });
});
