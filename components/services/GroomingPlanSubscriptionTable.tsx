"use client";

import { useMemo, useState } from "react";

import { GroomingPlanSubscriptionModal } from "@/components/services/GroomingPlanSubscriptionModal";
import { GroomingPlanUsageModal } from "@/components/services/GroomingPlanUsageModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { sortGroomingPlanUsage } from "@/services/services";
import type {
  GroomingPlan,
  GroomingPlanSubscription,
  GroomingPlanUsage,
  NewGroomingPlanSubscriptionInput,
  NewGroomingPlanUsageInput,
  Pet,
} from "@/types/domain";

interface GroomingPlanSubscriptionTableProps {
  subscriptions: GroomingPlanSubscription[];
  plans: GroomingPlan[];
  pets: Pet[];
  onDelete: (id: number) => void;
  onDeleteUsage: (id: number) => void;
  onRegisterUsage: (input: NewGroomingPlanUsageInput) => void;
  onUpdate: (
    input: NewGroomingPlanSubscriptionInput,
    subscriptionId?: number,
  ) => void;
}

function getCurrentMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const toDateString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;

  return {
    end: toDateString(end),
    label: start.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
    start: toDateString(start),
  };
}

function getStatusClasses(status: GroomingPlanSubscription["status"]) {
  if (status === "Ativo") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Pausado") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-slate-100 text-slate-500";
}

function getDaysUntil(dateString?: string | null) {
  if (!dateString) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${dateString}T00:00:00`);
  dueDate.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
}

function getBillingMessage(subscription: GroomingPlanSubscription) {
  if (!subscription.next_billing_date) {
    return "Sem vencimento";
  }

  const daysUntil = getDaysUntil(subscription.next_billing_date);

  if (daysUntil === null) {
    return "Sem vencimento";
  }

  if (daysUntil < 0) {
    return `Vencido há ${Math.abs(daysUntil)} dia(s)`;
  }

  if (daysUntil === 0) {
    return "Vence hoje";
  }

  if (daysUntil <= 7) {
    return `Vence em ${daysUntil} dia(s)`;
  }

  return `Vence em ${daysUntil} dia(s)`;
}

function isAttentionDue(subscription: GroomingPlanSubscription) {
  const daysUntil = getDaysUntil(subscription.next_billing_date);

  return subscription.status === "Ativo" && daysUntil !== null && daysUntil <= 7;
}

function getMonthlyUsages(subscription: GroomingPlanSubscription) {
  const range = getCurrentMonthRange();

  return (subscription.grooming_plan_usage || []).filter((usage) => {
    return usage.usage_date >= range.start && usage.usage_date <= range.end;
  });
}

function getUsageSummary(subscription: GroomingPlanSubscription) {
  const monthlyUsages = getMonthlyUsages(subscription);
  const bathsUsed = monthlyUsages
    .filter((usage) => usage.usage_type === "Banho")
    .reduce((total, usage) => total + Number(usage.quantity || 0), 0);
  const benefitsUsed = monthlyUsages
    .filter((usage) => usage.usage_type === "Benefício")
    .reduce((total, usage) => total + Number(usage.quantity || 0), 0);
  const bathsTotal = Number(subscription.baths_per_month || 0);
  const benefitsTotal = subscription.free_benefits?.length || 0;

  return {
    bathsRemaining: Math.max(bathsTotal - bathsUsed, 0),
    bathsTotal,
    bathsUsed,
    benefitsRemaining: Math.max(benefitsTotal - benefitsUsed, 0),
    benefitsTotal,
    benefitsUsed,
  };
}

function UsageList({
  onDeleteUsage,
  usages,
}: {
  usages: GroomingPlanUsage[];
  onDeleteUsage: (id: number) => void;
}) {
  const [usageToDelete, setUsageToDelete] = useState<GroomingPlanUsage | null>(
    null,
  );
  const sortedUsages = useMemo(() => sortGroomingPlanUsage(usages), [usages]);
  const latestUsages = sortedUsages.slice(0, 3);

  if (latestUsages.length === 0) {
    return (
      <p className="text-xs text-slate-400">Nenhum uso registrado ainda.</p>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {latestUsages.map((usage) => (
          <div
            key={usage.id}
            className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600"
          >
            <span>
              {formatDate(usage.usage_date)} · {usage.usage_type}
              {usage.benefit_name ? `: ${usage.benefit_name}` : ""} ·{" "}
              {usage.quantity}x
            </span>
            <button
              type="button"
              onClick={() => setUsageToDelete(usage)}
              className="font-semibold text-red-600"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={Boolean(usageToDelete)}
        title="Excluir uso"
        description="Deseja excluir este uso do plano?"
        confirmText="Excluir"
        onConfirm={() => {
          if (!usageToDelete) {
            return;
          }

          onDeleteUsage(usageToDelete.id);
          setUsageToDelete(null);
        }}
        onCancel={() => setUsageToDelete(null)}
      />
    </>
  );
}

export function GroomingPlanSubscriptionTable({
  subscriptions,
  plans,
  pets,
  onDelete,
  onDeleteUsage,
  onRegisterUsage,
  onUpdate,
}: GroomingPlanSubscriptionTableProps) {
  const [subscriptionToDelete, setSubscriptionToDelete] =
    useState<GroomingPlanSubscription | null>(null);
  const currentMonth = getCurrentMonthRange();

  function renderCounters(subscription: GroomingPlanSubscription) {
    const summary = getUsageSummary(subscription);

    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-purple-50 p-3">
          <p className="text-xs font-semibold text-[#8A0EEA]">Banhos</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {summary.bathsUsed}/{summary.bathsTotal}
          </p>
          <p className="text-xs text-slate-500">
            Restam {summary.bathsRemaining}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-700">Benefícios</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {summary.benefitsUsed}/{summary.benefitsTotal}
          </p>
          <p className="text-xs text-slate-500">
            Restam {summary.benefitsRemaining}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-[#8A0EEA]">
        Consumo exibido para {currentMonth.label}. O vencimento avisa quando
        estiver vencido ou faltando até 7 dias.
      </div>

      <div className="space-y-3 xl:hidden">
        {subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhuma assinatura de plano cadastrada.
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <article
              key={subscription.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {subscription.pets?.nome || "Pet não informado"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {subscription.pets?.tutors?.nome || "Tutor não informado"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    subscription.status,
                  )}`}
                >
                  {subscription.status}
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">
                  {subscription.grooming_plans?.name || "Plano mensal"}
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(subscription.monthly_price)} ·{" "}
                  {formatDate(subscription.start_date)}
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    isAttentionDue(subscription)
                      ? "text-red-600"
                      : "text-slate-600"
                  }`}
                >
                  {getBillingMessage(subscription)}
                </p>
              </div>

              <div className="mt-3">{renderCounters(subscription)}</div>

              {subscription.free_benefits?.length > 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  Benefícios: {subscription.free_benefits.join(", ")}
                </p>
              )}

              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Últimos usos
                </p>
                <UsageList
                  usages={subscription.grooming_plan_usage || []}
                  onDeleteUsage={onDeleteUsage}
                />
              </div>

              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
                <GroomingPlanUsageModal
                  subscription={subscription}
                  triggerLabel="Registrar uso"
                  onSave={onRegisterUsage}
                />

                <GroomingPlanSubscriptionModal
                  subscription={subscription}
                  plans={plans}
                  pets={pets}
                  triggerLabel="Editar"
                  title="Editar assinatura"
                  onSave={onUpdate}
                />

                <button
                  type="button"
                  onClick={() => setSubscriptionToDelete(subscription)}
                  className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border bg-white xl:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Pet / tutor</th>
                <th className="p-3 text-left sm:p-4">Plano</th>
                <th className="p-3 text-left sm:p-4">Vencimento</th>
                <th className="p-3 text-left sm:p-4">Consumo</th>
                <th className="p-3 text-left sm:p-4">Últimos usos</th>
                <th className="p-3 text-left sm:p-4">Status</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-sm text-slate-500"
                  >
                    Nenhuma assinatura de plano cadastrada.
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-t align-top">
                    <td className="p-3 sm:p-4">
                      <div className="font-semibold text-slate-900">
                        {subscription.pets?.nome || "Pet não informado"}
                      </div>
                      <div className="text-sm text-slate-500">
                        {subscription.pets?.tutors?.nome ||
                          "Tutor não informado"}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="font-semibold text-slate-900">
                        {subscription.grooming_plans?.name || "Plano mensal"}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatCurrency(subscription.monthly_price)} · início{" "}
                        {formatDate(subscription.start_date)}
                      </div>
                      {subscription.free_benefits?.length > 0 && (
                        <div className="mt-1 max-w-xs text-xs text-slate-500">
                          {subscription.free_benefits.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div
                        className={`font-semibold ${
                          isAttentionDue(subscription)
                            ? "text-red-600"
                            : "text-slate-700"
                        }`}
                      >
                        {getBillingMessage(subscription)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDate(subscription.next_billing_date)}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      {renderCounters(subscription)}
                    </td>
                    <td className="max-w-sm p-3 sm:p-4">
                      <UsageList
                        usages={subscription.grooming_plan_usage || []}
                        onDeleteUsage={onDeleteUsage}
                      />
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                          subscription.status,
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col gap-2">
                        <GroomingPlanUsageModal
                          subscription={subscription}
                          triggerLabel="Registrar uso"
                          onSave={onRegisterUsage}
                        />
                        <GroomingPlanSubscriptionModal
                          subscription={subscription}
                          plans={plans}
                          pets={pets}
                          triggerLabel="Editar"
                          title="Editar assinatura"
                          onSave={onUpdate}
                        />
                        <button
                          type="button"
                          onClick={() => setSubscriptionToDelete(subscription)}
                          className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(subscriptionToDelete)}
        title="Excluir assinatura"
        description={`Deseja excluir a assinatura de ${
          subscriptionToDelete?.pets?.nome || "este pet"
        }? Os usos registrados também serão removidos.`}
        confirmText="Excluir"
        onConfirm={() => {
          if (!subscriptionToDelete) {
            return;
          }

          onDelete(subscriptionToDelete.id);
          setSubscriptionToDelete(null);
        }}
        onCancel={() => setSubscriptionToDelete(null)}
      />
    </>
  );
}
