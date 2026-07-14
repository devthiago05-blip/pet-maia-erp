"use client";

import {
  AlertTriangle,
  CalendarDays,
  MessageCircle,
  PawPrint,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { fetchGroomingSupplyAlerts } from "@/services/grooming";
import { dismissPetBathReminder } from "@/services/pets";
import type {
  Appointment,
  FinancialEntry,
  GroomerDailyPayment,
  GroomingSupply,
  GroomingSupplyMovement,
} from "@/types/domain";

type DashboardDetail =
  | "pets"
  | "tutors"
  | "weeklyAppointments"
  | "completedAppointments"
  | "pendingAppointments"
  | "pendingRevenue"
  | "paidRevenue"
  | "bathReminders"
  | "groomingAlerts";

type BathReminderAction = "whatsapp" | "schedule" | "delete";

interface BathReminder {
  petId: number;
  tutorId?: number;
  petName: string;
  tutorName: string;
  tutorPhone?: string;
  intervalDays: number;
  daysWithoutBath: number | null;
  reminderLevel: "normal" | "attention" | "urgent";
  lastBathDate?: string;
}
interface BathAppointmentForReminder {
  pet_id?: number | null;
  data?: string | null;
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

  return Math.floor(
    (today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  return formatDateInput(new Date());
}

function getNextThursdayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const daysUntilThursday = (4 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilThursday);

  return formatDateInput(date);
}

function getReminderLevel(daysWithoutBath: number | null) {
  if (daysWithoutBath === null || daysWithoutBath >= 60) {
    return "urgent";
  }

  if (daysWithoutBath >= 45) {
    return "attention";
  }

  return "normal";
}

function buildBathReminders(
  petsList: Array<{
    id: number;
    nome: string;
    tutor_id?: number | null;
    bath_reminder_interval_days?: number | null;
    bath_reminder_dismissed_until?: string | null;
    tutors?:
      | { nome?: string; telefone?: string }
      | Array<{ nome?: string; telefone?: string }>;
  }>,
  finalizedBaths: BathAppointmentForReminder[],
): BathReminder[] {
  const reminders: BathReminder[] = [];
  const today = getTodayDate();

  for (const pet of petsList) {
    if (
      pet.bath_reminder_dismissed_until &&
      pet.bath_reminder_dismissed_until >= today
    ) {
      continue;
    }

    const tutor = Array.isArray(pet.tutors) ? pet.tutors[0] : pet.tutors;
    const lastBath = finalizedBaths.find(
      (appointment) => Number(appointment.pet_id) === Number(pet.id),
    );
    const intervalDays = pet.bath_reminder_interval_days || 30;

    if (!lastBath) {
      reminders.push({
        petId: Number(pet.id),
        tutorId: pet.tutor_id ? Number(pet.tutor_id) : undefined,
        petName: pet.nome,
        tutorName: tutor?.nome || "Tutor não informado",
        tutorPhone: tutor?.telefone,
        intervalDays,
        daysWithoutBath: null,
        reminderLevel: "urgent",
      });
      continue;
    }

    const lastBathDate = parseDateOnly(lastBath.data || undefined);

    if (!lastBathDate) {
      continue;
    }

    const daysWithoutBath = calculateDaysSince(lastBathDate);

    if (daysWithoutBath <= intervalDays) {
      continue;
    }

    reminders.push({
      petId: Number(pet.id),
      tutorId: pet.tutor_id ? Number(pet.tutor_id) : undefined,
      petName: pet.nome,
      tutorName: tutor?.nome || "Tutor não informado",
      tutorPhone: tutor?.telefone,
      intervalDays,
      daysWithoutBath,
      reminderLevel: getReminderLevel(daysWithoutBath),
      lastBathDate: lastBath.data || undefined,
    });
  }

  return reminders;
}

export default function HomePage() {
  const router = useRouter();
  const [pets, setPets] = useState(0);
  const [tutors, setTutors] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [recebido, setRecebido] = useState(0);
  const [receber, setReceber] = useState(0);

  const [ultimosAgendamentos, setUltimosAgendamentos] = useState<Appointment[]>(
    [],
  );
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
  const [lowStockSupplies, setLowStockSupplies] = useState<GroomingSupply[]>(
    [],
  );
  const [pendingSupplyPayments, setPendingSupplyPayments] = useState<
    GroomingSupplyMovement[]
  >([]);
  const [pendingGroomerPayments, setPendingGroomerPayments] = useState<
    GroomerDailyPayment[]
  >([]);
  const [pendingReminderAction, setPendingReminderAction] = useState<{
    reminder: BathReminder;
    action: BathReminderAction;
  } | null>(null);

  const [activeDetail, setActiveDetail] = useState<DashboardDetail | null>(
    null,
  );

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
          groomingAlerts,
        ] = await Promise.all([
          fetchDashboardCounts(),
          fetchRecentAppointments(),
          fetchRecentFinancialEntries(),
          fetchWeeklyPaidRevenue(),
          fetchWeeklyPendingRevenue(),
          fetchWeeklyAppointments(),
          fetchWeeklyAppointmentsByStatus("Finalizado"),
          fetchWeeklyAppointmentsByStatus("Pendente"),
          fetchPetsForBathReminders(),
          fetchFinalizedBathAppointmentsForReminders(),
          fetchGroomingSupplyAlerts(),
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

        if (!groomingAlerts.error && groomingAlerts.data) {
          setLowStockSupplies(groomingAlerts.data.lowStockSupplies || []);
          setPendingSupplyPayments(groomingAlerts.data.pendingPayables || []);
          setPendingGroomerPayments(
            groomingAlerts.data.pendingGroomerPayments || [],
          );
        }
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

  function openReminderDestination(
    reminder: BathReminder,
    action: BathReminderAction,
  ) {
    if (action === "whatsapp") {
      const whatsappLink = createBathReminderWhatsAppLink(reminder);

      if (whatsappLink) {
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
      }

      return;
    }

    if (action === "schedule") {
      router.push(createBathReminderAppointmentLink(reminder));
    }
  }

  async function dismissBathReminder(reminder: BathReminder) {
    const dismissedUntil = getNextThursdayDate();
    const { error } = await dismissPetBathReminder(
      reminder.petId,
      dismissedUntil,
    );

    if (error) {
      console.error(error);
      toast.error("Não foi possível remover o lembrete.");
      return false;
    }

    setBathReminders((currentReminders) =>
      currentReminders.filter(
        (currentReminder) => currentReminder.petId !== reminder.petId,
      ),
    );
    toast.success("Lembrete removido até a próxima quinta-feira.");
    return true;
  }

  async function handleConfirmReminderAction() {
    if (!pendingReminderAction) {
      return;
    }

    const { reminder, action } = pendingReminderAction;
    const dismissed = await dismissBathReminder(reminder);

    setPendingReminderAction(null);

    if (dismissed && action !== "delete") {
      openReminderDestination(reminder, action);
    }
  }

  function handleKeepReminderAndContinue() {
    if (!pendingReminderAction) {
      return;
    }

    const { reminder, action } = pendingReminderAction;
    setPendingReminderAction(null);

    if (action !== "delete") {
      openReminderDestination(reminder, action);
    }
  }

  function requestReminderAction(
    reminder: BathReminder,
    action: BathReminderAction,
  ) {
    setPendingReminderAction({ reminder, action });
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

    const elapsedText =
      reminder.daysWithoutBath === null
        ? "está sem banho finalizado registrado no sistema"
        : `está há ${reminder.daysWithoutBath} dias sem banho`;
    const urgencyText =
      reminder.reminderLevel === "urgent"
        ? "Como já passou bastante do intervalo ideal, recomendamos agendar o quanto antes."
        : reminder.reminderLevel === "attention"
          ? "Já passou de 45 dias, então vale a pena agendar para manter a rotina em dia."
          : "Que tal agendarmos um horário para deixar ele limpinho e cheiroso novamente?";

    const message = `Olá, ${reminder.tutorName}.

Percebemos que o ${reminder.petName} ${elapsedText}.

${urgencyText}

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
                      : appointment.status === "Pendente"
                        ? "bg-blue-100 text-blue-700"
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
              <p className="font-semibold text-slate-800">{entry.descricao}</p>

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
  function renderGroomingAlertsList() {
    const hasAlerts =
      lowStockSupplies.length > 0 ||
      pendingSupplyPayments.length > 0 ||
      pendingGroomerPayments.length > 0;

    if (!hasAlerts) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
          Nenhum alerta de insumo no momento.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {lowStockSupplies.length > 0 && (
          <DashboardAlertSection title="Estoque baixo">
            {lowStockSupplies.map((supply) => (
              <DashboardAlertItem
                key={supply.id}
                title={supply.name}
                description={`Estoque atual: ${formatStockValue(
                  supply.current_stock,
                )} ${supply.unit}. Mínimo: ${formatStockValue(
                  supply.minimum_stock,
                )} ${supply.unit}.`}
              />
            ))}
          </DashboardAlertSection>
        )}

        {pendingSupplyPayments.length > 0 && (
          <DashboardAlertSection title="Contas de insumos pendentes">
            {pendingSupplyPayments.map((movement) => (
              <DashboardAlertItem
                key={movement.id}
                title={movement.grooming_supplies?.name || "Compra de insumo"}
                description={`Vencimento: ${formatDateLabel(
                  movement.due_date,
                )}. Valor: ${formatCurrency(Number(movement.total_cost || 0))}.`}
              />
            ))}
          </DashboardAlertSection>
        )}

        {pendingGroomerPayments.length > 0 && (
          <DashboardAlertSection title="Diárias de tosador pendentes">
            {pendingGroomerPayments.map((payment) => (
              <DashboardAlertItem
                key={payment.id}
                title={payment.professional_name}
                description={`Vencimento: ${formatDateLabel(
                  payment.due_date,
                )}. Valor: ${formatCurrency(Number(payment.amount || 0))}.`}
              />
            ))}
          </DashboardAlertSection>
        )}

        <a
          href="/services/insumos"
          className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Abrir insumos
        </a>
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
          const levelLabel =
            reminder.reminderLevel === "urgent"
              ? "60+ dias"
              : reminder.reminderLevel === "attention"
                ? "45+ dias"
                : "Atenção";
          const levelClass =
            reminder.reminderLevel === "urgent"
              ? "bg-red-100 text-red-700"
              : reminder.reminderLevel === "attention"
                ? "bg-amber-100 text-amber-700"
                : "bg-purple-100 text-[#8A0EEA]";

          return (
            <div
              key={reminder.petId}
              className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-800">
                    {reminder.petName}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClass}`}
                  >
                    {levelLabel}
                  </span>
                </div>

                <p className="text-sm text-slate-500">
                  Tutor: {reminder.tutorName}
                </p>

                <p className="text-sm text-slate-500">
                  {reminder.daysWithoutBath === null
                    ? "Sem banho finalizado registrado."
                    : `Está há ${reminder.daysWithoutBath} dias sem banho.`}
                </p>

                <p className="text-xs text-slate-400">
                  Recorrência: {reminder.intervalDays} dias
                </p>

                {reminder.lastBathDate && (
                  <p className="text-xs text-slate-400">
                    Último banho: {reminder.lastBathDate}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={() => requestReminderAction(reminder, "delete")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>

                {whatsappLink ? (
                  <button
                    type="button"
                    onClick={() => requestReminderAction(reminder, "whatsapp")}
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Enviar WhatsApp
                  </button>
                ) : (
                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400">
                    Sem telefone
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => requestReminderAction(reminder, "schedule")}
                  className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Agendar
                </button>
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
                Existem <strong>{pets}</strong> pets cadastrados no sistema.
                Para ver a lista completa, acesse o menu <strong>Pets</strong>.
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
                Existem <strong>{tutors}</strong> tutores cadastrados no
                sistema. Para ver a lista completa, acesse o menu{" "}
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

            <StatCard
              title="Alertas de Insumos"
              value={String(
                lowStockSupplies.length +
                  pendingSupplyPayments.length +
                  pendingGroomerPayments.length,
              )}
              icon={<AlertTriangle size={24} />}
              active={activeDetail === "groomingAlerts"}
              onClick={() => handleSelectDetail("groomingAlerts")}
            >
              {renderGroomingAlertsList()}
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
                        {item.descricao.replace(/^Consulta\b/i, "Atendimento")}
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

      {pendingReminderAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Remover dos lembretes?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Deseja tirar {pendingReminderAction.reminder.petName} dos
              lembretes até a próxima quinta-feira?
            </p>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleKeepReminderAndContinue}
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Manter e continuar
              </button>

              <button
                type="button"
                onClick={handleConfirmReminderAction}
                className="rounded-xl bg-[#8A0EEA] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7600d1]"
              >
                Remover até quinta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardAlertSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DashboardAlertItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
      <p className="font-semibold text-amber-900">{title}</p>
      <p className="mt-1 text-sm text-amber-800">{description}</p>
    </div>
  );
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function formatStockValue(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
}
