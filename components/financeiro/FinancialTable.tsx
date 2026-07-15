"use client";

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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1260px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Descricao</th>
                <th className="p-3 text-left sm:p-4">Tutor</th>
                <th className="p-3 text-left sm:p-4">Pet</th>
                <th className="p-3 text-left sm:p-4">Origem</th>
                <th className="p-3 text-left sm:p-4">Tipo</th>
                <th className="p-3 text-left sm:p-4">Valor</th>
                <th className="p-3 text-left sm:p-4">Pagamento</th>
                <th className="p-3 text-left sm:p-4">Data do titulo</th>
                <th className="p-3 text-left sm:p-4">Vencimento</th>
                <th className="p-3 text-left sm:p-4">Status</th>
                <th className="p-3 text-left sm:p-4">Acoes</th>
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

                      <td className="p-3 sm:p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            effectiveType === "Despesa"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {effectiveType}
                        </span>
                      </td>

                      <td className="p-3 sm:p-4">
                        {formatCurrency(entry.valor)}
                      </td>

                      <td className="p-3 text-sm text-slate-600 sm:p-4">
                        {entry.forma_pagamento || "-"}
                      </td>

                      <td className="p-3 sm:p-4">
                        {formatDate(entry.created_at)}
                      </td>

                      <td className="p-3 sm:p-4">
                        {effectiveType === "Despesa"
                          ? formatDate(entry.data_vencimento)
                          : "-"}
                      </td>

                      <td className="p-3 sm:p-4">
                        {entry.status_pagamento === "Pago" ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                            Pago
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="p-3 sm:p-4">
                        <div className="flex flex-wrap gap-3">
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
