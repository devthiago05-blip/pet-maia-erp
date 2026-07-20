"use client";

import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  getEffectiveFinancialEntryType,
  getFinancialOriginLabel,
} from "@/lib/financial-origin";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { FinancialEntry } from "@/types/domain";

interface FinancialTableProps {
  entries: FinancialEntry[];
  onDelete: (id: number) => void;
  onReceive: (id: number) => void;
  onEdit: (entry: FinancialEntry) => void;
}

export function FinancialTable({
  entries,
  onDelete,
  onReceive,
  onEdit,
}: FinancialTableProps) {
  const [entryToDelete, setEntryToDelete] = useState<FinancialEntry | null>(
    null,
  );

  function handleConfirmDelete() {
    if (!entryToDelete) {
      return;
    }

    onDelete(entryToDelete.id);
    setEntryToDelete(null);
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum lançamento financeiro encontrado.
          </div>
        ) : (
          entries.map((entry) => {
            const effectiveType = getEffectiveFinancialEntryType(entry);
            const isExpense = effectiveType === "Despesa";
            const isPaid = entry.status_pagamento === "Pago";

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isExpense
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {effectiveType}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isPaid ? "Pago" : "Pendente"}
                      </span>
                    </div>
                    <h3 className="mt-3 break-words font-bold text-slate-900">
                      {entry.descricao}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {getFinancialOriginLabel(entry.origem)}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-lg font-bold ${
                      isExpense ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {formatCurrency(entry.valor)}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  {(entry.tutors?.nome || entry.pets?.nome) && (
                    <p>
                      {[entry.tutors?.nome, entry.pets?.nome]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <CreditCard size={16} className="shrink-0 text-slate-400" />
                    {entry.forma_pagamento || "Pagamento não informado"}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays
                      size={16}
                      className="shrink-0 text-slate-400"
                    />
                    Lançamento: {formatDate(entry.created_at)}
                  </p>
                  {isExpense && entry.data_vencimento && (
                    <p className="pl-6">
                      Vencimento: {formatDate(entry.data_vencimento)}
                    </p>
                  )}
                </div>

                <div
                  className={`mt-3 grid gap-2 border-t border-slate-100 pt-3 ${
                    isPaid ? "grid-cols-2" : "grid-cols-3"
                  }`}
                >
                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => onReceive(entry.id)}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-green-50 text-sm font-semibold text-green-700"
                    >
                      <CheckCircle2 size={16} />
                      {isExpense ? "Pagar" : "Receber"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-purple-50 text-sm font-semibold text-[#8A0EEA]"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryToDelete(entry)}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-sm font-semibold text-red-600"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="min-w-80 p-3 text-left sm:p-4">Descricao</th>
                <th className="min-w-36 p-3 text-left sm:p-4">Tutor</th>
                <th className="min-w-32 p-3 text-left sm:p-4">Pet</th>
                <th className="min-w-24 p-3 text-left whitespace-nowrap sm:p-4">
                  Origem
                </th>
                <th className="min-w-24 p-3 text-left whitespace-nowrap sm:p-4">
                  Tipo
                </th>
                <th className="min-w-28 p-3 text-left whitespace-nowrap sm:p-4">
                  Valor
                </th>
                <th className="min-w-28 p-3 text-left whitespace-nowrap sm:p-4">
                  Pagamento
                </th>
                <th className="min-w-32 p-3 text-left whitespace-nowrap sm:p-4">
                  Data do titulo
                </th>
                <th className="min-w-28 p-3 text-left whitespace-nowrap sm:p-4">
                  Vencimento
                </th>
                <th className="min-w-28 p-3 text-left whitespace-nowrap sm:p-4">
                  Status
                </th>
                <th className="sticky right-0 min-w-48 bg-slate-50 p-3 text-left whitespace-nowrap shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] sm:p-4">
                  Acoes
                </th>
              </tr>
            </thead>

            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="p-6 text-center text-sm text-slate-500"
                  >
                    Nenhum lancamento financeiro encontrado.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const effectiveType = getEffectiveFinancialEntryType(entry);

                  return (
                    <tr key={entry.id} className="border-t">
                      <td className="p-3 sm:p-4">{entry.descricao}</td>

                      <td className="p-3 text-sm text-slate-600 sm:p-4">
                        {entry.tutors?.nome || "-"}
                      </td>

                      <td className="p-3 text-sm text-slate-600 sm:p-4">
                        {entry.pets?.nome || "-"}
                      </td>

                      <td className="p-3 text-sm text-slate-600 sm:p-4">
                        {getFinancialOriginLabel(entry.origem)}
                      </td>

                      <td className="p-3 whitespace-nowrap sm:p-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${
                            effectiveType === "Despesa"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {effectiveType}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap sm:p-4">
                        {formatCurrency(entry.valor)}
                      </td>

                      <td className="p-3 text-sm whitespace-nowrap text-slate-600 sm:p-4">
                        {entry.forma_pagamento || "-"}
                      </td>

                      <td className="p-3 whitespace-nowrap sm:p-4">
                        {formatDate(entry.created_at)}
                      </td>

                      <td className="p-3 whitespace-nowrap sm:p-4">
                        {effectiveType === "Despesa"
                          ? formatDate(entry.data_vencimento)
                          : "-"}
                      </td>

                      <td className="p-3 whitespace-nowrap sm:p-4">
                        {entry.status_pagamento === "Pago" ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm whitespace-nowrap text-green-700">
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm whitespace-nowrap text-yellow-700">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="sticky right-0 bg-white p-3 whitespace-nowrap shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] sm:p-4">
                        <div className="flex flex-nowrap gap-3">
                          {entry.status_pagamento !== "Pago" && (
                            <button
                              type="button"
                              onClick={() => onReceive(entry.id)}
                              className="text-green-600"
                            >
                              {effectiveType === "Despesa"
                                ? "Pagar"
                                : "Receber"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEdit(entry)}
                            className="text-[#8A0EEA]"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => setEntryToDelete(entry)}
                            className="text-red-600"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(entryToDelete)}
        title="Excluir lancamento"
        description={`Deseja excluir ${entryToDelete?.descricao}?`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </>
  );
}
