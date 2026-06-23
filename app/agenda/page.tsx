"use client";

import { useState } from "react";

import { AppointmentTable } from "@/components/agenda/AppointmentTable";
import { KanbanBoard } from "@/components/agenda/KanbanBoard";
import { FinishAppointmentModal } from "@/components/agenda/FinishAppointmentModal";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  updateAppointmentStatus,
} from "@/services/appointments";
import { createAppointmentFinancialEntry } from "@/services/financial";
import { fetchPets } from "@/services/pets";
import { fetchTutors } from "@/services/tutors";
import type {
  Appointment,
  NewAppointmentInput,
  Pet,
  Tutor,
} from "@/types/domain";

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [appointmentToFinish, setAppointmentToFinish] =
    useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  async function loadPets() {
    const { data, error } = await fetchPets();

    if (error) {
      console.error(error);
      return;
    }

    setPets(data || []);
  }

  async function loadTutors() {
    const { data, error } = await fetchTutors();

    if (error) {
      console.error(error);
      return;
    }

    setTutors(data || []);
  }

  async function loadAppointments() {
    const { data, error } = await fetchAppointments();

    if (error) {
      console.error(error);
      return;
    }

    setAppointments(data || []);
  }

  useMountEffect(() => {
    loadPets();
    loadTutors();
    loadAppointments();
  });

  async function handleCreateAppointment(novoAgendamento: NewAppointmentInput) {
    const petSelecionado = pets.find((pet) => pet.nome === novoAgendamento.pet);

    if (!petSelecionado) {
      alert("Pet não encontrado");
      return;
    }

    const { error } = await createAppointment(
      novoAgendamento,
      petSelecionado.id,
    );

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Agendamento criado com sucesso!");
    await loadAppointments();
  }

  async function handleDeleteAppointment(id: number) {
    const { error } = await deleteAppointment(id);

    if (error) {
      console.error(error);
      return;
    }

    setAppointments(
      appointments.filter((appointment) => appointment.id !== id),
    );
  }

  async function handleFinishAppointment({
    valor,
    formaPagamento,
  }: {
    valor: number;
    formaPagamento: string;
  }) {
    if (!appointmentToFinish) {
      return;
    }

    const petName = appointmentToFinish.pets?.nome || "";
    const { error } = await createAppointmentFinancialEntry(
      petName,
      valor,
      formaPagamento,
    );

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await updateAppointmentStatus(appointmentToFinish.id,"Finalizado",);
    alert("Atendimento finalizado!");
    setAppointmentToFinish(null);
    await loadAppointments();
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Agenda
              </h1>
              <p className="text-slate-500">Gerencie os agendamentos</p>
            </div>

            <NewAppointmentModal
              tutors={tutors}
              pets={pets}
              onSave={handleCreateAppointment}
            />
          </div>

          <div className="flex rounded-2xl bg-white p-1 shadow-sm">
  <button
    type="button"
    onClick={() => setViewMode("kanban")}
    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
      viewMode === "kanban"
        ? "bg-[#8A0EEA] text-white"
        : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    Kanban
  </button>

  <button
    type="button"
    onClick={() => setViewMode("list")}
    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
      viewMode === "list"
        ? "bg-[#8A0EEA] text-white"
        : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    Lista
  </button>
</div>

{viewMode === "kanban" ? (
  <KanbanBoard
    appointments={appointments}
    onFinish={setAppointmentToFinish}
    onCancel={handleDeleteAppointment}
  />
) : (
  <AppointmentTable
    appointments={appointments}
    onFinish={setAppointmentToFinish}
    onDelete={handleDeleteAppointment}
  />
)}
        </div>

        {appointmentToFinish && (
          <FinishAppointmentModal
            pet={appointmentToFinish.pets?.nome || ""}
            onSave={handleFinishAppointment}
          />
        )}
      </main>
    </div>
  );
}
