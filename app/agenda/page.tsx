"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppointmentTable } from "@/components/agenda/AppointmentTable";
import { FinishAppointmentModal } from "@/components/agenda/FinishAppointmentModal";
import { KanbanBoard } from "@/components/agenda/KanbanBoard";
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
    const petId = Number(novoAgendamento.petId);
    const petSelecionado = pets.find((pet) => pet.id === petId);

    if (!petSelecionado) {
      toast.error("Pet não encontrado");
      return;
    }

    const { error } = await createAppointment(novoAgendamento, petId);

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    toast.success("Agendamento criado com sucesso!");
    await loadAppointments();
  }

  async function handleDeleteAppointment(id: number) {
    const { error } = await deleteAppointment(id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir agendamento");
      return;
    }

    setAppointments((currentAppointments) =>
      currentAppointments.filter((appointment) => appointment.id !== id),
    );

    toast.success("Agendamento excluído!");
  }

  async function handleCancelAppointment(id: number) {
    const { error } = await updateAppointmentStatus(id, "Cancelado");

    if (error) {
      console.error(error);
      toast.error("Erro ao cancelar agendamento");
      return;
    }

    toast.success("Agendamento cancelado!");
    await loadAppointments();
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
      toast.error(error.message);
      return;
    }

    await updateAppointmentStatus(appointmentToFinish.id, "Finalizado");
    toast.success("Atendimento finalizado!");
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

          <div className="flex w-full rounded-2xl bg-white p-1 shadow-sm sm:w-fit">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${
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
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${
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
              onCancel={handleCancelAppointment}
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
