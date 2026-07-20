"use client";

import { Printer, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
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
  formatAppointmentObservation,
  getAppointmentPetDisplayName,
} from "@/lib/appointment-observation";
import {
  createAppointment,
  deleteAppointment,
  deleteAppointmentServicesByAppointmentId,
  fetchAppointments,
  fetchAppointmentServicesByAppointmentId,
  replaceAppointmentServices,
  updateAppointment,
  updateAppointmentStatus,
  updateAppointmentTime,
} from "@/services/appointments";
import {
  createAppointmentFinancialEntry,
  deleteFinancialEntriesByAppointmentId,
  fetchFinancialEntriesByAppointmentId,
} from "@/services/financial";
import { fetchPets } from "@/services/pets";
import { fetchServices } from "@/services/services";
import { fetchClinicSettings } from "@/services/settings";
import { fetchTutors } from "@/services/tutors";
import type {
  Appointment,
  ClinicSettings,
  CompletedAppointmentService,
  FinancialEntry,
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
function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitialStatusFilter(status: string | null) {
  return ["Pendente", "Agendado", "Finalizado", "Cancelado"].includes(
    status || "",
  )
    ? status || "Todos"
    : "Todos";
}
function extractReceiptObservations(description?: string, petName?: string) {
  if (!description?.includes("| Obs:")) {
    return undefined;
  }

  const observationPart = description.split("| Obs:")[1]?.trim();

  if (!observationPart) {
    return undefined;
  }

  if (!petName) {
    return observationPart;
  }

  return observationPart.replace(new RegExp(` - ${petName}$`, "i"), "").trim();
}

export default function AgendaPage() {
  const searchParams = useSearchParams();
  const preselectedPetId = searchParams.get("petId") || "";
  const preselectedTutorId = searchParams.get("tutorId") || "";
  const preselectedStatus = getInitialStatusFilter(searchParams.get("status"));

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
    services: CompletedAppointmentService[];
    observacoes?: string;
  } | null>(null);

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState(preselectedStatus);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(
    Boolean(preselectedPetId),
  );
  const [appointmentToEdit, setAppointmentToEdit] =
    useState<Appointment | null>(null);

  const filteredAppointments = useMemo(() => {
    const term = normalizeText(search);

    return appointments.filter((appointment) => {
      const matchesSearch =
        !term ||
        normalizeText(appointment.pets?.nome || "").includes(term) ||
        normalizeText(appointment.pets?.tutors?.nome || "").includes(term) ||
        normalizeText(appointment.servico).includes(term) ||
        normalizeText(appointment.observacao || "").includes(term);

      const matchesDate =
        (!startDate || appointment.data >= startDate) &&
        (!endDate || appointment.data <= endDate);

      const matchesStatus =
        filterStatus === "Todos" || appointment.status === filterStatus;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [appointments, endDate, filterStatus, search, startDate]);

  const kanbanDate = startDate || getTodayDateString();

  const filteredKanbanAppointments = useMemo(() => {
    const term = normalizeText(search);

    return appointments.filter((appointment) => {
      const matchesDate = appointment.data === kanbanDate;

      const matchesSearch =
        !term ||
        normalizeText(appointment.pets?.nome || "").includes(term) ||
        normalizeText(appointment.pets?.tutors?.nome || "").includes(term) ||
        normalizeText(appointment.servico).includes(term) ||
        normalizeText(appointment.observacao || "").includes(term);

      const matchesStatus =
        filterStatus === "Todos" || appointment.status === filterStatus;

      return matchesDate && matchesSearch && matchesStatus;
    });
  }, [appointments, filterStatus, kanbanDate, search]);

  const preselectedPet = pets.find(
    (pet) => String(pet.id) === preselectedPetId,
  );

  const defaultAppointmentTutorId =
    preselectedTutorId ||
    (preselectedPet?.tutor_id ? String(preselectedPet.tutor_id) : "");

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

    if (appointmentToEdit) {
      const { error } = await updateAppointment(
        appointmentToEdit.id,
        novoAgendamento,
        petId,
      );

      if (error) {
        console.error(error);
        toast.error(error.message);
        return false;
      }

      toast.success("Agendamento atualizado com sucesso!");
      setAppointmentToEdit(null);
      await loadAppointments();
      return true;
    }

    const { error } = await createAppointment(novoAgendamento, petId);

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    toast.success("Agendamento criado com sucesso!");
    await loadAppointments();
    return true;
  }

  function handleEditAppointment(appointment: Appointment) {
    setAppointmentToEdit(appointment);
    setAppointmentModalOpen(true);
  }

  async function handleDeleteAppointment(id: number) {
    const { error } = await deleteAppointment(id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir agendamento");
      return;
    }

    const { error: financialError } =
      await deleteFinancialEntriesByAppointmentId(id);

    if (financialError) {
      console.error(financialError);
      toast.warning(
        "Agendamento excluído, mas não foi possível excluir o financeiro vinculado.",
      );
    } else {
      toast.success("Agendamento e financeiro vinculado excluídos!");
    }

    setAppointments((currentAppointments) =>
      currentAppointments.filter((appointment) => appointment.id !== id),
    );
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

  async function handleConfirmAppointment(appointment: Appointment) {
    if (!appointment.pet_id) {
      setAppointmentToEdit(appointment);
      setAppointmentModalOpen(true);
      toast.info("Selecione o tutor e associe o pet antes de confirmar.");
      return;
    }

    const { error } = await updateAppointmentStatus(appointment.id, "Agendado");

    if (error) {
      console.error(error);
      toast.error("Erro ao confirmar agendamento");
      return;
    }

    toast.success("Agendamento confirmado!");
    await loadAppointments();
  }

  async function handleRescheduleAppointment(id: number, hora: string) {
    const { error } = await updateAppointmentTime(id, hora);

    if (error) {
      console.error(error);
      toast.error("Erro ao alterar horario");
      return;
    }

    toast.success(`Horario alterado para ${hora}`);
    await loadAppointments();
  }

  async function handleFinishAppointment({
    valor,
    formaPagamento,
    servicoDescricao,
    observacoes,
    services: completedServices,
  }: {
    valor: number;
    formaPagamento: string;
    servicoDescricao: string;
    observacoes?: string;
    services: CompletedAppointmentService[];
  }) {
    if (!appointmentToFinish) {
      return;
    }

    const completedAppointment = appointmentToFinish;
    const petName = completedAppointment.pets?.nome || "";

    const descricaoCompleta = observacoes
      ? `${servicoDescricao} | Obs: ${observacoes}`
      : servicoDescricao;

    const { error } = await createAppointmentFinancialEntry(
      completedAppointment.id,
      petName,
      descricaoCompleta,
      valor,
      formaPagamento,
      completedAppointment.pet_id,
      completedAppointment.pets?.tutor_id,
    );

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    const { error: servicesError } = await replaceAppointmentServices(
      completedAppointment.id,
      completedServices,
    );

    if (servicesError) {
      console.error(servicesError);

      await deleteFinancialEntriesByAppointmentId(completedAppointment.id);

      toast.error(
        "Erro ao salvar os serviços realizados. O lançamento financeiro foi desfeito.",
      );
      return;
    }

    const { error: statusError } = await updateAppointmentStatus(
      completedAppointment.id,
      "Finalizado",
    );

    if (statusError) {
      console.error(statusError);

      await deleteFinancialEntriesByAppointmentId(completedAppointment.id);
      await deleteAppointmentServicesByAppointmentId(completedAppointment.id);

      toast.error(
        "Erro ao finalizar atendimento. O financeiro e os serviços foram desfeitos.",
      );
      return;
    }

    toast.success("Atendimento finalizado!");

    setCompletedReceipt({
      appointment: completedAppointment,
      valor,
      formaPagamento,
      services: completedServices,
      observacoes,
    });

    setAppointmentToFinish(null);
    await loadAppointments();
  }
  async function handleViewReceipt(appointment: Appointment) {
    const [servicesResponse, financialResponse] = await Promise.all([
      fetchAppointmentServicesByAppointmentId(appointment.id),
      fetchFinancialEntriesByAppointmentId(appointment.id),
    ]);

    if (servicesResponse.error) {
      console.error(servicesResponse.error);
      toast.error("Não foi possível carregar os serviços do recibo.");
      return;
    }

    if (financialResponse.error) {
      console.error(financialResponse.error);
      toast.error("Não foi possível carregar o financeiro do recibo.");
      return;
    }

    const financialEntry = (financialResponse.data?.[0] ||
      null) as FinancialEntry | null;

    if (!financialEntry) {
      toast.error(
        "Nenhum lançamento financeiro encontrado para este atendimento.",
      );
      return;
    }

    const receiptServices: CompletedAppointmentService[] =
      servicesResponse.data?.map((service) => ({
        serviceName: service.service_name,
        price: Number(service.price || 0),
      })) || [];

    setCompletedReceipt({
      appointment,
      valor: Number(financialEntry.valor || 0),
      formaPagamento: financialEntry.forma_pagamento || "PIX",
      services: receiptServices,
      observacoes: extractReceiptObservations(
        financialEntry.descricao,
        appointment.pets?.nome,
      ),
    });
  }

  function handlePrintAppointments() {
    window.print();
  }

  const appointmentsToPrint =
    viewMode === "kanban" ? filteredKanbanAppointments : filteredAppointments;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 print:hidden sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Agenda
              </h1>
              <p className="text-slate-500">Gerencie os agendamentos</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handlePrintAppointments}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#8A0EEA]/20 bg-white px-4 py-2 font-semibold text-[#8A0EEA] transition hover:bg-purple-50 sm:w-auto"
              >
                <Printer size={18} />
                Imprimir
              </button>

              <NewAppointmentModal
                tutors={tutors}
                pets={pets}
                services={services}
                onSave={handleCreateAppointment}
                open={appointmentModalOpen}
                onOpenChange={(open) => {
                  setAppointmentModalOpen(open);

                  if (!open) {
                    setAppointmentToEdit(null);
                  }
                }}
                defaultTutorId={defaultAppointmentTutorId}
                defaultPetId={preselectedPetId}
                appointment={appointmentToEdit}
              />
            </div>
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
              Horarios
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
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Data inicial
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border p-3 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Data final
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-xl border p-3 text-sm font-normal text-slate-900"
              />
            </label>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-xl border p-3"
            >
              <option>Todos</option>
              <option>Pendente</option>
              <option>Agendado</option>
              <option>Finalizado</option>
              <option>Cancelado</option>
            </select>
          </div>

          {viewMode === "kanban" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm text-[#8A0EEA]">
                Grade exibindo apenas os agendamentos de{" "}
                {kanbanDate.split("-").reverse().join("/")}. Arraste um card
                para outra linha para alterar o horario.
              </div>

              <KanbanBoard
                appointments={filteredKanbanAppointments}
                onFinish={setAppointmentToFinish}
                onViewReceipt={handleViewReceipt}
                onConfirm={handleConfirmAppointment}
                onCancel={handleCancelAppointment}
                onDelete={handleDeleteAppointment}
                onEdit={handleEditAppointment}
                onReschedule={handleRescheduleAppointment}
              />
            </div>
          ) : (
            <AppointmentTable
              appointments={filteredAppointments}
              onFinish={setAppointmentToFinish}
              onViewReceipt={handleViewReceipt}
              onConfirm={handleConfirmAppointment}
              onDelete={handleDeleteAppointment}
              onEdit={handleEditAppointment}
            />
          )}
        </div>

        {appointmentToFinish && (
          <FinishAppointmentModal
            pet={appointmentToFinish.pets?.nome || ""}
            porte={appointmentToFinish.pets?.porte}
            servico={appointmentToFinish.servico}
            services={services}
            onClose={() => setAppointmentToFinish(null)}
            onSave={handleFinishAppointment}
          />
        )}

        {completedReceipt && (
          <AppointmentReceiptModal
            appointment={completedReceipt.appointment}
            clinicSettings={clinicSettings}
            valor={completedReceipt.valor}
            formaPagamento={completedReceipt.formaPagamento}
            services={completedReceipt.services}
            observacoes={completedReceipt.observacoes}
            onClose={() => setCompletedReceipt(null)}
          />
        )}

        <AppointmentPrintView
          appointments={appointmentsToPrint}
          title={
            viewMode === "kanban"
              ? `Agendamentos de ${kanbanDate.split("-").reverse().join("/")}`
              : "Agendamentos filtrados"
          }
        />
      </main>
    </div>
  );
}

function AppointmentPrintView({
  appointments,
  title,
}: {
  appointments: Appointment[];
  title: string;
}) {
  const printedAt = new Date().toLocaleString("pt-BR");

  return (
    <section className="document-print-area hidden bg-white p-8 print:block">
      <div className="mb-6 border-b-2 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          PET MAIA ERP
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Impresso em {printedAt}</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Data</th>
            <th className="border p-2">Hora</th>
            <th className="border p-2">Foto</th>
            <th className="border p-2">Pet</th>
            <th className="border p-2">Tutor</th>
            <th className="border p-2">Serviço</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Observação</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr>
              <td className="border p-4 text-center" colSpan={8}>
                Nenhum agendamento encontrado.
              </td>
            </tr>
          ) : (
            appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="border p-2">
                  {appointment.data.split("-").reverse().join("/")}
                </td>
                <td className="border p-2">{appointment.hora}</td>
                <td className="border p-2">
                  {appointment.pets?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={appointment.pets.photo_url}
                      alt={appointment.pets?.nome || "Pet"}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border p-2">
                  {getAppointmentPetDisplayName(appointment)}
                </td>
                <td className="border p-2">
                  {appointment.pets?.tutors?.nome || "-"}
                </td>
                <td className="border p-2">{appointment.servico}</td>
                <td className="border p-2">{appointment.status}</td>
                <td className="whitespace-pre-line border p-2">
                  {formatAppointmentObservation(appointment)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
