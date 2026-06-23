"use client";

import { CalendarDays, PawPrint, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/dashboard/StatCard";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  fetchDashboardCounts,
  fetchRecentAppointments,
} from "@/services/dashboard";
import {
  fetchPaidRevenueValues,
  fetchPendingRevenueValues,
  fetchRecentFinancialEntries,
} from "@/services/financial";
import type { Appointment, FinancialEntry } from "@/types/domain";

export default function HomePage() {
  const [pets, setPets] = useState(0);
  const [tutors, setTutors] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [recebido, setRecebido] = useState(0);
  const [receber, setReceber] = useState(0);
  const [ultimosAgendamentos, setUltimosAgendamentos] = useState<Appointment[]>(
    [],
  );
  const [ultimosRecebimentos, setUltimosRecebimentos] = useState<
    FinancialEntry[]
  >([]);

  useEffect(() => {
    async function loadData() {
      const [counts, appointmentsResponse, recebimentos, receitas, pendentes] =
        await Promise.all([
          fetchDashboardCounts(),
          fetchRecentAppointments(),
          fetchRecentFinancialEntries(),
          fetchPaidRevenueValues(),
          fetchPendingRevenueValues(),
        ]);

      const totalRecebido =
        receitas.data?.reduce((total, item) => total + Number(item.valor), 0) ||
        0;

      const totalReceber =
        pendentes.data?.reduce(
          (total, item) => total + Number(item.valor),
          0,
        ) || 0;

      setPets(counts.petsCount);
      setTutors(counts.tutorsCount);
      setAppointments(counts.appointmentsCount);
      setUltimosAgendamentos(appointmentsResponse.data || []);
      setUltimosRecebimentos(recebimentos.data || []);
      setRecebido(totalRecebido);
      setReceber(totalReceber);
    }

    loadData();
  }, []);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-5">
            <StatCard
              title="Pets"
              value={String(pets)}
              icon={<PawPrint size={24} />}
            />

            <StatCard
              title="Tutores"
              value={String(tutors)}
              icon={<Users size={24} />}
            />

            <StatCard
              title="Agendamentos"
              value={String(appointments)}
              icon={<CalendarDays size={24} />}
            />

            <StatCard
              title="A Receber"
              value={`R$ ${receber.toFixed(2)}`}
              icon={<Wallet size={24} />}
            />

            <StatCard
              title="Recebido"
              value={`R$ ${recebido.toFixed(2)}`}
              icon={<Wallet size={24} />}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-bold sm:text-xl">
                Últimos Agendamentos
              </h2>

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
                      <p className="text-sm text-slate-500">
                        {appointment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-bold sm:text-xl">
                Últimos Recebimentos
              </h2>

              <div className="space-y-3">
                {ultimosRecebimentos.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.descricao}</p>
                      <p className="text-sm text-slate-500">
                        {item.forma_pagamento}
                      </p>
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
