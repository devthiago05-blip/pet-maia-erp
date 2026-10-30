import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarRange,
  Minus,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import type { Appointment } from "@/types/domain";

interface DashboardInsightsProps {
  currentAppointments: Appointment[];
  previousAppointments: Appointment[];
  currentPaidRevenue: number;
  currentPendingRevenue: number;
  previousPaidRevenue: number;
}

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getAppointmentDayIndex(dateValue?: string) {
  const [year, month, day] = (dateValue || "").split("-").map(Number);

  if (!year || !month || !day) {
    return -1;
  }

  const dayOfWeek = new Date(year, month - 1, day).getDay();

  return (dayOfWeek + 6) % 7;
}

function buildDailyTotals(appointments: Appointment[]) {
  return appointments.reduce<number[]>(
    (totals, appointment) => {
      const dayIndex = getAppointmentDayIndex(appointment.data);

      if (dayIndex >= 0) {
        totals[dayIndex] += 1;
      }

      return totals;
    },
    [0, 0, 0, 0, 0, 0, 0],
  );
}

function getComparison(current: number, previous: number) {
  if (current === previous) {
    return {
      className: "bg-slate-100 text-slate-600",
      icon: <Minus size={14} />,
      label: "Sem alteração",
    };
  }

  if (previous <= 0) {
    return {
      className: "bg-emerald-100 text-emerald-700",
      icon: <ArrowUpRight size={14} />,
      label: "Nova movimentação",
    };
  }

  const percentage = Math.round(((current - previous) / previous) * 100);
  const increased = percentage > 0;

  return {
    className: increased
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700",
    icon: increased ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />,
    label: `${Math.abs(percentage)}% ${increased ? "a mais" : "a menos"}`,
  };
}

function ComparisonRow({
  current,
  icon,
  label,
  previous,
  valueFormatter = String,
}: {
  current: number;
  icon: ReactNode;
  label: string;
  previous: number;
  valueFormatter?: (value: number) => string;
}) {
  const comparison = getComparison(current, previous);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#8A0EEA] shadow-sm">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 truncate text-lg font-bold text-slate-900">
              {valueFormatter(current)}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${comparison.className}`}
        >
          {comparison.icon}
          {comparison.label}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Semana passada: {valueFormatter(previous)}
      </p>
    </div>
  );
}

export function DashboardInsights({
  currentAppointments,
  previousAppointments,
  currentPaidRevenue,
  currentPendingRevenue,
  previousPaidRevenue,
}: DashboardInsightsProps) {
  const dailyTotals = buildDailyTotals(currentAppointments);
  const maxDailyTotal = Math.max(...dailyTotals, 1);
  const currentCompleted = currentAppointments.filter(
    (appointment) => appointment.status === "Finalizado",
  ).length;
  const previousCompleted = previousAppointments.filter(
    (appointment) => appointment.status === "Finalizado",
  ).length;
  const financialTotal = currentPaidRevenue + currentPendingRevenue;
  const paidPercentage = financialTotal
    ? Math.round((currentPaidRevenue / financialTotal) * 100)
    : 0;

  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A0EEA]">
              Movimento da agenda
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Agendamentos por dia
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {currentAppointments.length} atendimento(s) nesta semana
          </p>
        </div>

        <div className="mt-6 grid h-48 grid-cols-7 gap-2 sm:gap-3">
          {dailyTotals.map((total, index) => {
            const height = total
              ? Math.max((total / maxDailyTotal) * 100, 12)
              : 4;

            return (
              <div
                key={weekDays[index]}
                className="flex min-w-0 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-bold text-slate-600">
                  {total}
                </span>
                <div className="flex h-32 w-full max-w-12 items-end overflow-hidden rounded-xl bg-purple-50">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-[#8A0EEA] to-[#c878ff] transition-all"
                    style={{ height: `${height}%` }}
                    title={`${weekDays[index]}: ${total} agendamento(s)`}
                  />
                </div>
                <span className="truncate text-[11px] font-semibold text-slate-500 sm:text-xs">
                  {weekDays[index]}
                </span>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A0EEA]">
            Comparativo
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Esta semana × semana passada
          </h2>
        </div>

        <div className="mt-4 grid gap-3">
          <ComparisonRow
            label="Agendamentos"
            current={currentAppointments.length}
            previous={previousAppointments.length}
            icon={<CalendarRange size={18} />}
          />
          <ComparisonRow
            label="Atendimentos concluídos"
            current={currentCompleted}
            previous={previousCompleted}
            icon={<CalendarCheck2 size={18} />}
          />
          <ComparisonRow
            label="Recebido"
            current={currentPaidRevenue}
            previous={previousPaidRevenue}
            icon={<Wallet size={18} />}
            valueFormatter={formatCurrency}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">
              Recebido x pendente
            </span>
            <strong className="text-[#8A0EEA]">{paidPercentage}% pago</strong>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500">Recebido</p>
              <p className="font-bold text-emerald-700">
                {formatCurrency(currentPaidRevenue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">A receber</p>
              <p className="font-bold text-amber-700">
                {formatCurrency(currentPendingRevenue)}
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
