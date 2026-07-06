"use client";

import {
  CalendarDays,
  MessageCircle,
  PawPrint,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/dashboard/StatCard";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  fetchDashboardCounts,
  fetchFinalizedBathAppointmentsForReminders,
  fetchPetsForBathReminders,
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
  | "paidRevenue"
  | "bathReminders";

interface BathReminder {
  petId: number;
  tutorId?: number;
  petName: string;
  tutorName: string;
  tutorPhone?: string;
  daysWithoutBath: number | null;
  lastBathDate?: string;
}
interface BathAppointmentForReminder {
  pet_id?: number | null;
  data?: string | null;
}

export default function HomePage() {
  const [pets, setPets] = useState(0);
  const [tutors, setTutors] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [recebido, setRecebido] = useState(0);
  const [receber, setReceber] = useState(0);

  const [ultimosAgendamentos, setUltimosAgendamentos] = useState<
    Appointment[]
  >([]);
  const [ultimosRecebimentos, setUltimosRecebimentos] = useState<
    FinancialEntry[]
  >([]);

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
  const [bathReminders, setBathReminders] = useState<BathReminder[]>([]);

  const [activeDetail, setActiveDetail] =
  useState<DashboardDetail | null>(null);

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
  petsForReminders,
  finalizedBathAppointments,
] = await Promise.all([
  fetchDashboardCounts(),
  fetchRecentAppointments(),
  fetchRecentFinancialEntries(),
  fetchWeeklyPaidRevenue(),
  fetchWeeklyPendingRevenue(),
  fetchWeeklyAppointments(),
  fetchWeeklyAppointmentsByStatus("Finalizado"),
  fetchWeeklyAppointmentsByStatus("Agendado"),
  fetchPetsForBathReminders(),
  fetchFinalizedBathAppointmentsForReminders(),
]);

        const weeklyAppointmentsData = weeklyAppointments.data || [];
        const completedAppointmentsData = completed.data || [];
        const pendingAppointmentsData = pending.data || [];
        const weeklyPaidRevenueData = receitas.data || [];
        const weeklyPendingRevenueData = pendentes.data || [];

        const totalRecebido = weeklyPaidRevenueData.reduce(
          (total, entry) => total + Number(entry.valor || 0),
          0,
        );

        const totalReceber = weeklyPendingRevenueData.reduce(
          (total, entry) => total + Number(entry.valor || 0),
          0,
        );

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
        setBathReminders(
  buildBathReminders(
    petsForReminders.data || [],
    finalizedBathAppointments.data || [],
  ),
);
      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, []);

  function handleSelectDetail(detail: DashboardDetail) {
  setActiveDetail((currentDetail) =>
    currentDetail === detail ? null : detail,
  );
}
function parseDateOnly(value?: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function calculateDaysSince(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const differenceInMs = today.getTime() - targetDate.getTime();

  return Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
}

function buildBathReminders(
  petsList: Array<{
  id: number;
  nome: string;
  tutor_id?: number | null;
  tutors?:
      | {
          nome?: string;
          telefone?: string;
        }
      | {
          nome?: string;
          telefone?: string;
        }[];
  }>,
  finalizedBaths: BathAppointmentForReminder[],
): BathReminder[] {
  const reminders: BathReminder[] = [];

  for (const pet of petsList) {
    const tutor = Array.isArray(pet.tutors) ? pet.tutors[0] : pet.tutors;

    const lastBath = finalizedBaths.find(
      (appointment) => Number(appointment.pet_id) === Number(pet.id),
    );

    if (!lastBath) {
      reminders.push({
  petId: Number(pet.id),
  tutorId: pet.tutor_id ? Number(pet.tutor_id) : undefined,
  petName: pet.nome,
  tutorName: tutor?.nome || "Tutor não informado",
  tutorPhone: tutor?.telefone,
  daysWithoutBath: null,
});

      continue;
    }

    const lastBathDate = parseDateOnly(lastBath.data || undefined);

    if (!lastBathDate) {
      continue;
    }

    const daysWithoutBath = calculateDaysSince(lastBathDate);

    if (daysWithoutBath <= 30) {
      continue;
    }

   reminders.push({
  petId: Number(pet.id),
  tutorId: pet.tutor_id ? Number(pet.tutor_id) : undefined,
  petName: pet.nome,
  tutorName: tutor?.nome || "Tutor não informado",
  tutorPhone: tutor?.telefone,
  daysWithoutBath,
  lastBathDate: lastBath.data || undefined,
});
  }

  return reminders;
}

function formatPhoneForWhatsApp(phone?: string) {
  if (!phone) {
    return "";
  }

  const onlyNumbers = phone.replace(/\D/g, "");

  if (!onlyNumbers) {
    return "";
  }

  return onlyNumbers.startsWith("55") ? onlyNumbers : `55${onlyNumbers}`;
}

function createBathReminderWhatsAppLink(reminder: BathReminder) {
  const phone = formatPhoneForWhatsApp(reminder.tutorPhone);

  if (!phone) {
    return "";
  }

  const message = `Olá, ${reminder.tutorName}.

Percebemos que o ${reminder.petName} já está há algum tempo sem banho.

Que tal agendarmos um horário para deixar ele limpinho e cheiroso novamente?

Estamos com agenda aberta.

Equipe Pet Maia Banho e Tosa.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
function createBathReminderAppointmentLink(reminder: BathReminder) {
  const params = new URLSearchParams();

  params.set("petId", String(reminder.petId));

  if (reminder.tutorId) {
    params.set("tutorId", String(reminder.tutorId));
  }

  return `/agenda?${params.toString()}`;
}
  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function renderAppointmentsList(
    appointmentsList: Appointment[],
    emptyMessage: string,
  ) {
    if (appointmentsList.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {appointmentsList.map((appointment) => (
          <div
            key={appointment.id}
            className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto]"
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
                {appointment.data || "Sem data"} às{" "}
                {appointment.hora || "--:--"}
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
        ))}
      </div>
    );
  }

  function renderFinancialEntriesList(
    financialEntries: FinancialEntry[],
    emptyMessage: string,
  ) {
    if (financialEntries.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {financialEntries.map((entry) => (
          <div
            key={entry.id}
            className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto]"
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
        ))}
      </div>
    );
  }
function renderBathRemindersList() {
  if (bathReminders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
        Nenhum lembrete de banho recorrente no momento.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bathReminders.map((reminder) => {
        const whatsappLink = createBathReminderWhatsAppLink(reminder);

        return (
          <div
            key={reminder.petId}
            className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-800">
                {reminder.petName}
              </p>

              <p className="text-sm text-slate-500">
                Tutor: {reminder.tutorName}
              </p>

              <p className="text-sm text-slate-500">
                {reminder.daysWithoutBath === null
                  ? "Sem banho finalizado registrado."
                  : `Está há ${reminder.daysWithoutBath} dias sem banho.`}
              </p>

              {reminder.lastBathDate && (
                <p className="text-xs text-slate-400">
                  Último banho: {reminder.lastBathDate}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Enviar WhatsApp
                </a>
              ) : (
                <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400">
                  Sem telefone
                </span>
              )}

             <a
  href={createBathReminderAppointmentLink(reminder)}
  className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
>
  Agendar
</a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StatCard
              title="Pets"
              value={String(pets)}
              icon={<PawPrint size={24} />}
              active={activeDetail === "pets"}
              onClick={() => handleSelectDetail("pets")}
            >
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Existem <strong>{pets}</strong> pets cadastrados no sistema. Para
                ver a lista completa, acesse o menu <strong>Pets</strong>.
              </div>
            </StatCard>

            <StatCard
              title="Tutores"
              value={String(tutors)}
              icon={<Users size={24} />}
              active={activeDetail === "tutors"}
              onClick={() => handleSelectDetail("tutors")}
            >
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Existem <strong>{tutors}</strong> tutores cadastrados no sistema.
                Para ver a lista completa, acesse o menu{" "}
                <strong>Tutores</strong>.
              </div>
            </StatCard>

            <StatCard
              title="Agendamentos da Semana"
              value={String(appointments)}
              icon={<CalendarDays size={24} />}
              active={activeDetail === "weeklyAppointments"}
              onClick={() => handleSelectDetail("weeklyAppointments")}
            >
              {renderAppointmentsList(
                weeklyAppointmentsList,
                "Nenhum agendamento encontrado nesta semana.",
              )}
            </StatCard>

            <StatCard
              title="Concluídos"
              value={String(completedAppointments)}
              icon={<CalendarDays size={24} />}
              active={activeDetail === "completedAppointments"}
              onClick={() => handleSelectDetail("completedAppointments")}
            >
              {renderAppointmentsList(
                completedAppointmentsList,
                "Nenhum atendimento concluído nesta semana.",
              )}
            </StatCard>

            <StatCard
              title="Pendentes"
              value={String(pendingAppointments)}
              icon={<CalendarDays size={24} />}
              active={activeDetail === "pendingAppointments"}
              onClick={() => handleSelectDetail("pendingAppointments")}
            >
              {renderAppointmentsList(
                pendingAppointmentsList,
                "Nenhum agendamento pendente nesta semana.",
              )}
            </StatCard>

            <StatCard
              title="A Receber"
              value={formatCurrency(receber)}
              icon={<Wallet size={24} />}
              active={activeDetail === "pendingRevenue"}
              onClick={() => handleSelectDetail("pendingRevenue")}
            >
              {renderFinancialEntriesList(
                weeklyPendingRevenueList,
                "Nenhum valor pendente encontrado nesta semana.",
              )}
            </StatCard>

            <StatCard
              title="Recebido da Semana"
              value={formatCurrency(recebido)}
              icon={<Wallet size={24} />}
              active={activeDetail === "paidRevenue"}
              onClick={() => handleSelectDetail("paidRevenue")}
            >
              {renderFinancialEntriesList(
                weeklyPaidRevenueList,
                "Nenhum recebimento encontrado nesta semana.",
              )}
            </StatCard>
            <StatCard
  title="Lembretes de Banho"
  value={String(bathReminders.length)}
  icon={<MessageCircle size={24} />}
  active={activeDetail === "bathReminders"}
  onClick={() => handleSelectDetail("bathReminders")}
>
  {renderBathRemindersList()}
</StatCard>
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

                {ultimosAgendamentos.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                    Nenhum agendamento recente encontrado.
                  </div>
                )}
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
                      <p className="truncate font-medium">
                        {item.descricao.replace(
                          /^Consulta\b/i,
                          "Atendimento",
                        )}
                      </p>

                      <p className="text-sm text-slate-500">
                        {item.forma_pagamento}
                      </p>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p>{formatCurrency(Number(item.valor))}</p>

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

                {ultimosRecebimentos.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                    Nenhum recebimento recente encontrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}