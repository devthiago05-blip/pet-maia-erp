"use client";

import { useState } from "react";

import { AppointmentTable } from "@/components/agenda/AppointmentTable";

import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";

export default function AgendaPage() {
  const [appointments, setAppointments] = useState([
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
  const pets = [
  {
    id: 1,
    nome: "Rex",
  },
  {
    id: 2,
    nome: "Mel",
  },
  {
    id: 3,
    nome: "Nina",
  },
];

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

        <NewAppointmentModal
  pets={pets}
  onSave={(novoAgendamento) =>
    setAppointments([
      ...appointments,
      novoAgendamento,
    ])
  }
/>

      </div>

      <AppointmentTable
  appointments={appointments}
  onDelete={(id) =>
    setAppointments(
      appointments.filter(
        (appointment) =>
          appointment.id !== id
      )
    )
  }
  onComplete={(id) =>
    setAppointments(
      appointments.map(
        (appointment) =>
          appointment.id === id
            ? {
                ...appointment,
                status:
                  "Concluído",
              }
            : appointment
      )
    )
  }
/>

    </div>
  );
}