"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppointmentReceiptModal } from "@/components/agenda/AppointmentReceiptModal";
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
import { fetchServices } from "@/services/services";
import { fetchClinicSettings } from "@/services/settings";
import { fetchTutors } from "@/services/tutors";
import type {
  Appointment,
  ClinicSettings,
  NewAppointmentInput,
  Pet,
  Service,
  Tutor,
} from "@/types/domain";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function calculateAppointmentValue(
  appointment: Appointment,
  services: Service[],
) {
  const porte = normalizeText(appointment.pets?.porte || "");
  const priceField =
    porte === "pequeno"
      ? "preco_pequeno"
      : porte === "medio"
        ? "preco_medio"
        : porte === "grande"
          ? "preco_grande"
          : null;

  if (!priceField) {
    return null;
  }

  const selectedServiceNames = appointment.servico
    .split(" + ")
    .map(normalizeText)
    .filter(Boolean);

  const selectedServices = selectedServiceNames.map((serviceName) =>
    services.find((service) => normalizeText(service.nome) === serviceName),
  );

  if (
    selectedServices.length === 0 ||
    selectedServices.some((service) => !service)
  ) {
    return null;
  }

  return selectedServices.reduce(
    (total, service) => total + Number(service?.[priceField] || 0),
    0,
  );
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(
    null,
  );
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [appointmentToFinish, setAppointmentToFinish] =
    useState<Appointment | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<{
    appointment: Appointment;
    valor: number;
    formaPagamento: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const filteredAppointments = useMemo(() => {
    const term = normalizeText(search);

    return appointments.filter((appointment) => {
      const matchesSearch =
        !term ||
        normalizeText(appointment.pets?.nome || "").includes(term) ||
        normalizeText(appointment.pets?.tutors?.nome || "").includes(term) ||
        normalizeText(appointment.servico).includes(term);
      const matchesDate =
        (!startDate || appointment.data >= startDate) &&
        (!endDate || appointment.data <= endDate);
      const matchesStatus =
        filterStatus === "Todos" || appointment.status === filterStatus;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [appointments, endDate, filterStatus, search, startDate]);

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

  async function loadServices() {
    const { data, error } = await fetchServices();

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar serviços");
      return;
    }

    setServices(data || []);
  }

  async function loadClinicSettings() {
    const { data, error } = await fetchClinicSettings();

    if (error) {
      console.error(error);
      return;
    }

    setClinicSettings(data as ClinicSettings);
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
    loadServices();
    loadClinicSettings();
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

    const completedAppointment = appointmentToFinish;
    const petName = completedAppointment.pets?.nome || "";
    const { error } = await createAppointmentFinancialEntry(
      petName,
      completedAppointment.servico,
      valor,
      formaPagamento,
    );

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    const { error: statusError } = await updateAppointmentStatus(
      completedAppointment.id,
      "Finalizado",
    );

    if (statusError) {
      console.error(statusError);
      toast.error(statusError.message);
      return;
    }

    toast.success("Atendimento finalizado!");
    setCompletedReceipt({
      appointment: completedAppointment,
      valor,
      formaPagamento,
    });
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
              services={services}
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

          <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center gap-3 rounded-xl border px-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar pet, tutor ou serviço"
                className="min-w-0 flex-1 py-3 outline-none"
              />
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label="Data inicial"
              className="rounded-xl border p-3"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              aria-label="Data final"
              className="rounded-xl border p-3"
            />
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-xl border p-3"
            >
              <option>Todos</option>
              <option>Agendado</option>
              <option>Finalizado</option>
              <option>Cancelado</option>
            </select>
          </div>

          {viewMode === "kanban" ? (
            <KanbanBoard
              appointments={filteredAppointments}
              onFinish={setAppointmentToFinish}
              onCancel={handleCancelAppointment}
            />
          ) : (
            <AppointmentTable
              appointments={filteredAppointments}
              onFinish={setAppointmentToFinish}
              onDelete={handleDeleteAppointment}
            />
          )}
        </div>

        {appointmentToFinish && (
          <FinishAppointmentModal
            pet={appointmentToFinish.pets?.nome || ""}
            porte={appointmentToFinish.pets?.porte}
            servico={appointmentToFinish.servico}
            valorSugerido={calculateAppointmentValue(
              appointmentToFinish,
              services,
            )}
            onSave={handleFinishAppointment}
          />
        )}

        {completedReceipt && (
          <AppointmentReceiptModal
            appointment={completedReceipt.appointment}
            clinicSettings={clinicSettings}
            valor={completedReceipt.valor}
            formaPagamento={completedReceipt.formaPagamento}
            onClose={() => setCompletedReceipt(null)}
          />
        )}
      </main>
    </div>
  );
}
