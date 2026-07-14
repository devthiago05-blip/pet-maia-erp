"use client";

import {
  CalendarCheck,
  CircleDollarSign,
  ReceiptText,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency } from "@/lib/formatters";
import { fetchAppointments } from "@/services/appointments";
import { fetchFinancialEntries } from "@/services/financial";
import type { Appointment, FinancialEntry } from "@/types/domain";

function isWithinPeriod(value: string | undefined, start: string, end: string) {
  if (!value) {
    return false;
  }

  const date = value.slice(0, 10);
  return (!start || date >= start) && (!end || date <= end);
}

const operationalExpenseKeywords = [
  "manutencao",
  "maquina",
  "maquinas",
  "afiacao",
  "lamina",
  "laminas",
  "pecas",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isOperationalExpense(entry: FinancialEntry) {
  if (entry.tipo !== "Despesa") {
    return false;
  }

  const description = normalizeText(entry.descricao || "");
  return operationalExpenseKeywords.some((keyword) =>
    description.includes(keyword),
  );
}

export default function ReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tutorFilter, setTutorFilter] = useState("Todos");
  const [petFilter, setPetFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useMountEffect(() => {
    async function loadReports() {
      setLoading(true);
      const [appointmentsResponse, financialResponse] = await Promise.all([
        fetchAppointments(),
        fetchFinancialEntries(),
      ]);

      if (appointmentsResponse.error || financialResponse.error) {
        console.error(appointmentsResponse.error || financialResponse.error);
        setLoadError("Não foi possível carregar os dados dos relatórios.");
        setLoading(false);
        return;
      }

      setAppointments(appointmentsResponse.data || []);
      setEntries(financialResponse.data || []);
      setLoading(false);
    }

    loadReports();
  });

  const tutorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          appointments
            .map((appointment) => appointment.pets?.tutors?.nome)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort(),
    [appointments],
  );

  const petOptions = useMemo(
    () =>
      Array.from(
        new Set(
          appointments
            .filter(
              (appointment) =>
                tutorFilter === "Todos" ||
                appointment.pets?.tutors?.nome === tutorFilter,
            )
            .map((appointment) => appointment.pets?.nome)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort(),
    [appointments, tutorFilter],
  );

  const filteredAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          isWithinPeriod(appointment.data, startDate, endDate) &&
          (tutorFilter === "Todos" ||
            appointment.pets?.tutors?.nome === tutorFilter) &&
          (petFilter === "Todos" || appointment.pets?.nome === petFilter),
      ),
    [appointments, endDate, petFilter, startDate, tutorFilter],
  );

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) =>
        isWithinPeriod(entry.created_at, startDate, endDate),
      ),
    [endDate, entries, startDate],
  );

  const paidRevenue = filteredEntries
    .filter(
      (entry) => entry.tipo === "Receita" && entry.status_pagamento === "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);
  const pendingRevenue = filteredEntries
    .filter(
      (entry) => entry.tipo === "Receita" && entry.status_pagamento !== "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);
  const expenses = filteredEntries
    .filter((entry) => entry.tipo === "Despesa")
    .reduce((total, entry) => total + Number(entry.valor), 0);
  const pendingExpenses = filteredEntries
    .filter(
      (entry) => entry.tipo === "Despesa" && entry.status_pagamento !== "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);
  const operationalExpenses = filteredEntries.filter(isOperationalExpense);
  const operationalExpensesTotal = operationalExpenses.reduce(
    (total, entry) => total + Number(entry.valor),
    0,
  );
  const profit = paidRevenue - expenses;

  const serviceRanking = Object.entries(
    filteredAppointments.reduce<Record<string, number>>(
      (ranking, appointment) => {
        appointment.servico.split(" + ").forEach((service) => {
          const name = service.trim();
          ranking[name] = (ranking[name] || 0) + 1;
        });
        return ranking;
      },
      {},
    ),
  )
    .sort(([, first], [, second]) => second - first)
    .slice(0, 8);

  const paymentRanking = Object.entries(
    filteredEntries
      .filter((entry) => entry.tipo === "Receita")
      .reduce<Record<string, number>>((ranking, entry) => {
        const payment = entry.forma_pagamento || "Não informado";
        ranking[payment] = (ranking[payment] || 0) + Number(entry.valor);
        return ranking;
      }, {}),
  ).sort(([, first], [, second]) => second - first);

  const operationalExpenseRanking = Object.entries(
    operationalExpenses.reduce<Record<string, number>>((ranking, entry) => {
      const description = entry.descricao || "Despesa operacional";
      ranking[description] = (ranking[description] || 0) + Number(entry.valor);
      return ranking;
    }, {}),
  ).sort(([, first], [, second]) => second - first);

  const appointmentStatus = [
    "Pendente",
    "Agendado",
    "Finalizado",
    "Cancelado",
  ].map((status) => ({
      status,
      total: filteredAppointments.filter(
        (appointment) => appointment.status === status,
      ).length,
    }));

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              Relatórios
            </h1>
            <p className="text-slate-500">
              Indicadores financeiros e operacionais
            </p>
          </div>

          <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="grid gap-2 text-sm font-medium">
              Data inicial
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border p-3 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Data final
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-xl border p-3 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Tutor
              <select
                value={tutorFilter}
                onChange={(event) => {
                  setTutorFilter(event.target.value);
                  setPetFilter("Todos");
                }}
                className="rounded-xl border p-3 font-normal"
              >
                <option>Todos</option>
                {tutorOptions.map((tutor) => (
                  <option key={tutor}>{tutor}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Pet
              <select
                value={petFilter}
                onChange={(event) => setPetFilter(event.target.value)}
                className="rounded-xl border p-3 font-normal"
              >
                <option>Todos</option>
                {petOptions.map((pet) => (
                  <option key={pet}>{pet}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setTutorFilter("Todos");
                setPetFilter("Todos");
              }}
              className="self-end rounded-xl border px-4 py-3"
            >
              Limpar período
            </button>
          </div>

          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-slate-500">
              Carregando relatórios...
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <ReportCard
                  icon={<CircleDollarSign size={22} />}
                  label="Recebido"
                  value={formatCurrency(paidRevenue)}
                />
                <ReportCard
                  icon={<ReceiptText size={22} />}
                  label="A receber"
                  value={formatCurrency(pendingRevenue)}
                />
                <ReportCard
                  icon={<TrendingUp size={22} />}
                  label="Resultado"
                  value={formatCurrency(profit)}
                />
                <ReportCard
                  icon={<CalendarCheck size={22} />}
                  label="Atendimentos"
                  value={String(filteredAppointments.length)}
                />
                <ReportCard
                  icon={<Wrench size={22} />}
                  label="Manutenção e afiação"
                  value={formatCurrency(operationalExpensesTotal)}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <ReportList
                  title="Status da agenda"
                  items={appointmentStatus.map((item) => ({
                    label: item.status,
                    value: String(item.total),
                  }))}
                />
                <ReportList
                  title="Receitas por pagamento"
                  items={paymentRanking.map(([label, value]) => ({
                    label,
                    value: formatCurrency(value),
                  }))}
                />
                <ReportList
                  title="Serviços mais realizados"
                  items={serviceRanking.map(([label, value]) => ({
                    label,
                    value: `${value} atendimento${value === 1 ? "" : "s"}`,
                  }))}
                />
                <ReportList
                  title="Resumo financeiro"
                  items={[
                    {
                      label: "Receitas recebidas",
                      value: formatCurrency(paidRevenue),
                    },
                    {
                      label: "Receitas pendentes",
                      value: formatCurrency(pendingRevenue),
                    },
                    { label: "Despesas", value: formatCurrency(expenses) },
                    {
                      label: "Despesas pendentes",
                      value: formatCurrency(pendingExpenses),
                    },
                    { label: "Resultado", value: formatCurrency(profit) },
                  ]}
                />
                <ReportList
                  title="Manutenção, máquinas e afiação"
                  items={operationalExpenseRanking.map(([label, value]) => ({
                    label,
                    value: formatCurrency(value),
                  }))}
                />
              </div>

              <section className="overflow-hidden rounded-xl border bg-white">
                <div className="border-b p-4 sm:p-6">
                  <h2 className="text-lg font-bold">
                    Atendimentos por tutor e pet
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-left">Data</th>
                        <th className="p-4 text-left">Tutor</th>
                        <th className="p-4 text-left">Pet</th>
                        <th className="p-4 text-left">Serviços</th>
                        <th className="p-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-6 text-center text-sm text-slate-500"
                          >
                            Nenhum atendimento encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((appointment) => (
                          <tr key={appointment.id} className="border-t">
                            <td className="p-4">{appointment.data}</td>
                            <td className="p-4">
                              {appointment.pets?.tutors?.nome || "-"}
                            </td>
                            <td className="p-4">
                              {appointment.pets?.nome || "-"}
                            </td>
                            <td className="p-4">{appointment.servico}</td>
                            <td className="p-4">{appointment.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ReportCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ReportList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 divide-y">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">
            Nenhum dado no período selecionado.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="text-slate-600">{item.label}</span>
              <strong className="text-right">{item.value}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
