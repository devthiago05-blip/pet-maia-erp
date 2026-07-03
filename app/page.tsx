"use client";

import { CalendarDays, PawPrint, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/dashboard/StatCard";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  fetchDashboardCounts,
  fetchRecentAppointments,
  fetchWeeklyAppointments,
  fetchWeeklyAppointmentsByStatus,
} from "@/services/dashboard";
import {
  fetchRecentFinancialEntries,
  fetchWeeklyPaidRevenue,
  fetchWeeklyPendingRevenue,
} from "@/services/financial";
import type { Appointment, FinancialEntry } from "@/types/domain";
type DashboardDetail =
  | "pets"
  | "tutors"
  | "weeklyAppointments"
  | "completedAppointments"
  | "pendingAppointments"
  | "pendingRevenue"
  | "paidRevenue";

export default function HomePage() {
  const [pets, setPets] = useState(0);
  const [tutors, setTutors] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [recebido, setRecebido] = useState(0);
  const [receber, setReceber] = useState(0);
  const [ultimosAgendamentos, setUltimosAgendamentos] = useState<Appointment[]>([]);
  const [ultimosRecebimentos, setUltimosRecebimentos] = useState<FinancialEntry[]>([]);
  const [weeklyAppointmentsList, setWeeklyAppointmentsList] = useState<
  Appointment[]
>([]);

const [completedAppointmentsList, setCompletedAppointmentsList] = useState<
  Appointment[]
>([]);

const [pendingAppointmentsList, setPendingAppointmentsList] = useState<
  Appointment[]
>([]);

const [weeklyPaidRevenueList, setWeeklyPaidRevenueList] = useState<
  FinancialEntry[]
>([]);

const [weeklyPendingRevenueList, setWeeklyPendingRevenueList] = useState<
  FinancialEntry[]
>([]);

const [activeDetail, setActiveDetail] =
  useState<DashboardDetail>("weeklyAppointments");

  useEffect(() => {
  async function loadData() {
    try {
      const [
        counts,
        appointmentsResponse,
        recebimentos,
        receitas,
        pendentes,
        weeklyAppointments,
        completed,
        pending,
      ] = await Promise.all([
        fetchDashboardCounts(),
        fetchRecentAppointments(),
        fetchRecentFinancialEntries(),
        fetchWeeklyPaidRevenue(),
        fetchWeeklyPendingRevenue(),
        fetchWeeklyAppointments(),
        fetchWeeklyAppointmentsByStatus("Finalizado"),
        fetchWeeklyAppointmentsByStatus("Agendado"),
      ]);

      const totalRecebido =
        receitas.data?.reduce(
          (total, entry) => total + Number(entry.valor || 0),
          0,
        ) || 0;

      const totalReceber =
        pendentes.data?.reduce(
          (total, entry) => total + Number(entry.valor || 0),
          0,
        ) || 0;

      const weeklyAppointmentsData = weeklyAppointments.data || [];
      const completedAppointmentsData = completed.data || [];
      const pendingAppointmentsData = pending.data || [];
      const weeklyPaidRevenueData = receitas.data || [];
      const weeklyPendingRevenueData = pendentes.data || [];

      setPets(counts.petsCount);
      setTutors(counts.tutorsCount);

      setAppointments(weeklyAppointmentsData.length);
      setCompletedAppointments(completedAppointmentsData.length);
      setPendingAppointments(pendingAppointmentsData.length);

      setWeeklyAppointmentsList(weeklyAppointmentsData);
      setCompletedAppointmentsList(completedAppointmentsData);
      setPendingAppointmentsList(pendingAppointmentsData);
      setWeeklyPaidRevenueList(weeklyPaidRevenueData);
      setWeeklyPendingRevenueList(weeklyPendingRevenueData);

      setUltimosAgendamentos(appointmentsResponse.data || []);
      setUltimosRecebimentos(recebimentos.data || []);
      setRecebido(totalRecebido);
      setReceber(totalReceber);
    } catch (error) {
      console.error(error);
    }
  }

  loadData();
}, []);
  function handleSelectDetail(detail: DashboardDetail) {
  setActiveDetail(detail);
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getActiveDetailTitle() {
  const titles: Record<DashboardDetail, string> = {
    pets: "Pets cadastrados",
    tutors: "Tutores cadastrados",
    weeklyAppointments: "Agendamentos da semana",
    completedAppointments: "Atendimentos concluídos na semana",
    pendingAppointments: "Agendamentos pendentes na semana",
    pendingRevenue: "Valores a receber na semana",
    paidRevenue: "Recebimentos da semana",
  };

  return titles[activeDetail];
}

function getActiveAppointments() {
  if (activeDetail === "weeklyAppointments") {
    return weeklyAppointmentsList;
  }

  if (activeDetail === "completedAppointments") {
    return completedAppointmentsList;
  }

  if (activeDetail === "pendingAppointments") {
    return pendingAppointmentsList;
  }

  return [];
}

function getActiveFinancialEntries() {
  if (activeDetail === "paidRevenue") {
    return weeklyPaidRevenueList;
  }

  if (activeDetail === "pendingRevenue") {
    return weeklyPendingRevenueList;
  }

  return [];
}

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-5">
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-5">
  <button
    type="button"
    onClick={() => handleSelectDetail("pets")}
    className="text-left"
  >
    <StatCard title="Pets" value={String(pets)} icon={<PawPrint size={24} />} />
  </button>

  <button
    type="button"
    onClick={() => handleSelectDetail("tutors")}
    className="text-left"
  >
    <StatCard title="Tutores" value={String(tutors)} icon={<Users size={24} />} />
  </button>

  <button
    type="button"
    onClick={() => handleSelectDetail("weeklyAppointments")}
    className="text-left"
  >
    <StatCard
      title="Agendamentos da Semana"
      value={String(appointments)}
      icon={<CalendarDays size={24} />}
    />
  </button>

  <button
    type="button"
    onClick={() => handleSelectDetail("completedAppointments")}
    className="text-left"
  >
    <StatCard
      title="Concluídos"
      value={String(completedAppointments)}
      icon={<CalendarDays size={24} />}
    />
  </button>

  <button
    type="button"
    onClick={() => handleSelectDetail("pendingAppointments")}
    className="text-left"
  >
    <StatCard
      title="Pendentes"
      value={String(pendingAppointments)}
      icon={<CalendarDays size={24} />}
    />
  </button>

  <button
    type="button"
    onClick={() => handleSelectDetail("pendingRevenue")}
    className="text-left"
  >
    <StatCard
      title="A Receber"
      value={formatCurrency(receber)}
      icon={<Wallet size={24} />}
    />
  </button>

  <button
    type="button"
    onClick={() => handleSelectDetail("paidRevenue")}
    className="text-left"
  >
    <StatCard
      title="Recebido da Semana"
      value={formatCurrency(recebido)}
      icon={<Wallet size={24} />}
    />
  </button>
</div>
          </div>
          <div className="mt-6 rounded-2xl border bg-white p-4 sm:p-6">
  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-lg font-bold sm:text-xl">
        {getActiveDetailTitle()}
      </h2>

      <p className="text-sm text-slate-500">
        Detalhes do indicador selecionado no Dashboard.
      </p>
    </div>
  </div>

  {activeDetail === "pets" && (
    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
      Existem <strong>{pets}</strong> pets cadastrados no sistema.
      Para ver a lista completa, acesse o menu <strong>Pets</strong>.
    </div>
  )}

  {activeDetail === "tutors" && (
    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
      Existem <strong>{tutors}</strong> tutores cadastrados no sistema.
      Para ver a lista completa, acesse o menu <strong>Tutores</strong>.
    </div>
  )}

  {["weeklyAppointments", "completedAppointments", "pendingAppointments"].includes(
    activeDetail,
  ) && (
    <div className="space-y-3">
      {getActiveAppointments().length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
          Nenhum agendamento encontrado para este indicador.
        </div>
      ) : (
        getActiveAppointments().map((appointment) => (
          <div
            key={appointment.id}
            className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-800">
                {appointment.pets?.nome || "Pet não informado"}
              </p>

              <p className="text-sm text-slate-500">
                Tutor: {appointment.pets?.tutors?.nome || "Não informado"}
              </p>

              <p className="text-sm text-slate-500">
                Serviço: {appointment.servico}
              </p>
            </div>

            <div className="text-left text-sm sm:text-right">
              <p className="font-medium text-slate-700">
                {appointment.data || "Sem data"} às {appointment.hora || "--:--"}
              </p>

              <p
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  appointment.status === "Finalizado"
                    ? "bg-green-100 text-green-700"
                    : appointment.status === "Cancelado"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {appointment.status}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )}

  {["paidRevenue", "pendingRevenue"].includes(activeDetail) && (
    <div className="space-y-3">
      {getActiveFinancialEntries().length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
          Nenhum lançamento financeiro encontrado para este indicador.
        </div>
      ) : (
        getActiveFinancialEntries().map((entry) => (
          <div
            key={entry.id}
            className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-800">
                {entry.descricao}
              </p>

              <p className="text-sm text-slate-500">
                Forma de pagamento: {entry.forma_pagamento || "Não informado"}
              </p>
            </div>

            <div className="text-left text-sm sm:text-right">
              <p className="font-bold text-[#8A0EEA]">
                {formatCurrency(Number(entry.valor))}
              </p>

              <p
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  entry.status_pagamento === "Pago"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {entry.status_pagamento}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )}
</div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-bold sm:text-xl">Últimos Agendamentos</h2>

              <div className="space-y-3">
                {ultimosAgendamentos.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {appointment.pets?.nome || "-"}
                      </p>
                      <p className="break-words text-sm text-slate-500">
                        {appointment.servico}
                      </p>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p>{appointment.hora}</p>
                      <p className="text-sm text-slate-500">{appointment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-bold sm:text-xl">Últimos Recebimentos</h2>

              <div className="space-y-3">
                {ultimosRecebimentos.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.descricao.replace(/^Consulta\b/i, "Atendimento")}
                      </p>
                      <p className="text-sm text-slate-500">{item.forma_pagamento}</p>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p>R$ {item.valor}</p>
                      <p
                        className={`text-sm ${
                          item.status_pagamento === "Pago"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {item.status_pagamento}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
