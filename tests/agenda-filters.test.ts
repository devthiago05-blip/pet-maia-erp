import { describe, expect, it } from "vitest";

import { filterAgendaAppointments } from "@/lib/agenda-filters";
import type { Appointment } from "@/types/domain";

const appointments: Appointment[] = [
  {
    id: 1,
    data: "2026-10-01",
    hora: "09:00",
    servico: "Banho",
    status: "Agendado",
    pets: { nome: "Thor", tutors: { nome: "Ana" } },
  },
  {
    id: 2,
    data: "2026-11-15",
    hora: "10:00",
    servico: "Consulta",
    status: "Agendado",
    pets: { nome: "Mel", tutors: { nome: "Bruno" } },
  },
  {
    id: 3,
    data: "2026-12-20",
    hora: "11:00",
    servico: "Tosa",
    status: "Agendado",
    pets: { nome: "Bob", tutors: { nome: "Carlos" } },
  },
  {
    id: 4,
    data: "2026-11-11",
    hora: "12:00",
    servico: "Banho",
    status: "Finalizado",
    pets: { nome: "Luna", tutors: { nome: "Diana" } },
  },
];

describe("filtro da agenda", () => {
  it("mostra todos os Agendados independentemente da data", () => {
    const result = filterAgendaAppointments(
      appointments,
      "Agendado",
      "2026-11-11",
      "2026-11-11",
      "",
    );
    expect(result.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("mantem as datas para outros status", () => {
    const result = filterAgendaAppointments(
      appointments,
      "Finalizado",
      "2026-11-11",
      "2026-11-11",
      "",
    );
    expect(result.map((item) => item.id)).toEqual([4]);
  });

  it("mantem a busca por pet, tutor ou servico", () => {
    expect(
      filterAgendaAppointments(appointments, "Agendado", "", "", "mel").map(
        (item) => item.id,
      ),
    ).toEqual([2]);
    expect(
      filterAgendaAppointments(appointments, "Agendado", "", "", "carlos").map(
        (item) => item.id,
      ),
    ).toEqual([3]);
    expect(
      filterAgendaAppointments(appointments, "Agendado", "", "", "banho").map(
        (item) => item.id,
      ),
    ).toEqual([1]);
  });
});
