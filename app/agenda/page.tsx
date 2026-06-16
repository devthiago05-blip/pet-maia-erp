"use client";

import { useState } from "react";

import { AppointmentTable } from "@/components/agenda/AppointmentTable";

export default function AgendaPage() {
  const [appointments] = useState([
    {
      id: 1,
      pet: "Rex",
      servico: "Banho",
      data: "17/06/2026",
      hora: "08:00",
      status: "Agendado",
    },
    {
      id: 2,
      pet: "Mel",
      servico: "Consulta",
      data: "17/06/2026",
      hora: "09:00",
      status: "Agendado",
    },
    {
      id: 3,
      pet: "Nina",
      servico: "Vacina",
      data: "17/06/2026",
      hora: "10:00",
      status: "Concluído",
    },
  ]);

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-[#8A0EEA]">
            Agenda
          </h1>

          <p className="text-slate-500">
            Gerencie os agendamentos
          </p>
        </div>

        <button className="bg-[#8A0EEA] text-white px-4 py-2 rounded-xl">
          Novo Agendamento
        </button>

      </div>

      <AppointmentTable
        appointments={appointments}
      />

    </div>
  );
}