import { describe, expect, it } from "vitest";

import type { TutorHistoryAppointment } from "@/lib/tutor-history";
import {
  appointmentValue,
  completedHistoryTotal,
  historyText,
  lastCompletedBath,
  sortTutorHistory,
  tutorHistoryAccess,
} from "@/lib/tutor-history";
import type { FinancialEntry } from "@/types/domain";

const bath: TutorHistoryAppointment = {
  id: 1,
  pet_id: 7,
  data: "2026-10-10",
  hora: "09:00",
  status: "Finalizado",
  servico: "Banho",
  appointment_services: [
    { id: 1, appointment_id: 1, service_name: "Banho", price: 35 },
  ],
};

describe("Histórico do tutor", () => {
  it("usa apenas o banho finalizado do pet correto, em ordem cronológica", () => {
    const entries = [
      bath,
      { ...bath, id: 2, data: "2026-10-11", status: "Cancelado" as const },
      { ...bath, id: 3, data: "2026-10-12", status: "Agendado" as const },
      { ...bath, id: 4, data: "2026-10-13", pet_id: 8 },
    ];
    expect(lastCompletedBath(entries, 7)?.id).toBe(1);
    expect(sortTutorHistory(entries).map((item) => item.id)).toEqual([
      4, 3, 2, 1,
    ]);
    expect(entries[0].id).toBe(1);
  });

  it("prioriza os serviços realizados sobre a descrição do agendamento", () => {
    expect(
      lastCompletedBath(
        [
          {
            ...bath,
            appointment_services: [
              {
                id: 2,
                appointment_id: 1,
                service_name: "Corte de unhas",
                price: 10,
              },
            ],
          },
        ],
        7,
      ),
    ).toBeUndefined();
    expect(
      lastCompletedBath(
        [
          {
            ...bath,
            servico: "Tosa",
            appointment_services: [
              {
                id: 2,
                appointment_id: 1,
                service_name: "Banho e tosa",
                price: 50,
              },
            ],
          },
        ],
        7,
      )?.id,
    ).toBe(1);
  });

  it("não transforma ausência de valor em zero", () => {
    expect(
      appointmentValue({ ...bath, appointment_services: [] }, []),
    ).toBeNull();
    expect(
      appointmentValue(
        {
          ...bath,
          appointment_services: [
            { id: 2, appointment_id: 1, service_name: "Brinde", price: 0 },
          ],
        },
        [],
      ),
    ).toBe(0);
    expect(historyText(" ")).toBe("Não informado");
  });

  it("usa o lançamento vinculado mais recente, sem misturar outros atendimentos ou despesas", () => {
    const entries: FinancialEntry[] = [
      {
        id: 1,
        descricao: "",
        origem: "appointment",
        referencia_id: 1,
        tipo: "Receita",
        valor: 30,
      },
      {
        id: 2,
        descricao: "",
        origem: "appointment",
        referencia_id: 1,
        tipo: "Receita",
        valor: 0,
      },
      {
        id: 3,
        descricao: "",
        origem: "appointment",
        referencia_id: 2,
        tipo: "Receita",
        valor: 100,
      },
      {
        id: 4,
        descricao: "",
        origem: "appointment",
        referencia_id: 1,
        tipo: "Despesa",
        valor: 100,
      },
    ];
    expect(appointmentValue(bath, entries)).toBe(0);
  });

  it("soma apenas finalizados e identifica valores faltantes", () => {
    expect(
      completedHistoryTotal(
        [
          bath,
          { ...bath, id: 2, status: "Cancelado" },
          { ...bath, id: 3, status: "Pendente" },
          { ...bath, id: 4, appointment_services: [] },
        ],
        [],
      ),
    ).toEqual({ total: 35, known: 1, missing: 1 });
  });

  it("distingue ausência de registros de ausência de valores", () => {
    expect(completedHistoryTotal([], [])).toEqual({
      total: 0,
      known: 0,
      missing: 0,
    });
    expect(
      completedHistoryTotal([{ ...bath, appointment_services: [] }], []),
    ).toEqual({ total: 0, known: 0, missing: 1 });
  });

  it("respeita os módulos que as políticas existentes permitem consultar", () => {
    expect(tutorHistoryAccess((module) => module === "tutores")).toEqual({
      history: false,
      services: false,
      financial: false,
    });
    expect(tutorHistoryAccess((module) => module === "pets")).toEqual({
      history: true,
      services: false,
      financial: false,
    });
    expect(tutorHistoryAccess((module) => module === "agenda")).toEqual({
      history: true,
      services: true,
      financial: false,
    });
    expect(tutorHistoryAccess(() => true)).toEqual({
      history: true,
      services: true,
      financial: true,
    });
  });
});
