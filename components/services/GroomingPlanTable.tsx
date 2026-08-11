"use client";

import { useState } from "react";

import { GroomingPlanModal } from "@/components/services/GroomingPlanModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency } from "@/lib/formatters";
import type { GroomingPlan } from "@/types/domain";

interface GroomingPlanTableProps {
  plans: GroomingPlan[];
  onDelete: (id: number) => void;
  onUpdate: (plan: GroomingPlan) => void;
}

function formatBenefits(plan: GroomingPlan) {
  if (!plan.free_benefits?.length) {
    return "Sem benefício grátis";
  }

  return plan.free_benefits.join(", ");
}

export function GroomingPlanTable({
  plans,
  onDelete,
  onUpdate,
}: GroomingPlanTableProps) {
  const [planToDelete, setPlanToDelete] = useState<GroomingPlan | null>(null);

  function handleConfirmDelete() {
    if (!planToDelete) {
      return;
    }

    onDelete(planToDelete.id);
    setPlanToDelete(null);
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum plano cadastrado.
          </div>
        ) : (
          plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-[#8A0EEA]">
                    {formatCurrency(plan.monthly_price)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    plan.active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {plan.active ? "Ativo" : "Inativo"}
                </span>
              </div>

              <p className="mt-3 rounded-xl bg-purple-50 px-3 py-2 text-sm font-semibold text-[#8A0EEA]">
                {plan.baths_per_month} banho(s) por mês
              </p>

              <p className="mt-3 text-sm text-slate-600">
                {formatBenefits(plan)}
              </p>

              {plan.notes && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                  {plan.notes}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <GroomingPlanModal
                  plan={plan}
                  triggerLabel="Editar"
                  title="Editar plano"
                  onSave={(updatedPlan) => onUpdate(updatedPlan as GroomingPlan)}
                />

                <button
                  type="button"
                  onClick={() => setPlanToDelete(plan)}
                  className="rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-600"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border bg-white md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Plano</th>
                <th className="p-3 text-left sm:p-4">Valor mensal</th>
                <th className="p-3 text-left sm:p-4">Banhos/mês</th>
                <th className="p-3 text-left sm:p-4">Benefícios grátis</th>
                <th className="p-3 text-left sm:p-4">Status</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-slate-500"
                  >
                    Nenhum plano cadastrado.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="border-t">
                    <td className="p-3 sm:p-4">
                      <div className="font-semibold text-slate-900">
                        {plan.name}
                      </div>
                      {plan.notes && (
                        <div className="mt-1 max-w-xs whitespace-pre-line text-xs text-slate-500">
                          {plan.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-[#8A0EEA] sm:p-4">
                      {formatCurrency(plan.monthly_price)}
                    </td>
                    <td className="p-3 sm:p-4">
                      {plan.baths_per_month} banho(s)
                    </td>
                    <td className="max-w-md p-3 text-sm text-slate-600 sm:p-4">
                      {formatBenefits(plan)}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          plan.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {plan.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-wrap gap-3">
                        <GroomingPlanModal
                          plan={plan}
                          triggerLabel="Editar"
                          title="Editar plano"
                          onSave={(updatedPlan) =>
                            onUpdate(updatedPlan as GroomingPlan)
                          }
                        />

                        <button
                          type="button"
                          onClick={() => setPlanToDelete(plan)}
                          className="font-semibold text-red-600"
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
        isOpen={Boolean(planToDelete)}
        title="Excluir plano"
        description={`Deseja excluir ${planToDelete?.name}?`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPlanToDelete(null)}
      />
    </>
  );
}
