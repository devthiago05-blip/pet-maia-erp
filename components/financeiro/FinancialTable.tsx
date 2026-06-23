"use client";

import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency } from "@/lib/formatters";
import type { FinancialEntry } from "@/types/domain";

interface FinancialTableProps {
  entries: FinancialEntry[];
  onDelete: (id: number) => void;
  onReceive: (id: number) => void;
}

export function FinancialTable({
  entries,
  onDelete,
  onReceive,
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
          <table className="w-full min-w-[780px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Descrição</th>
                <th className="p-3 text-left sm:p-4">Tipo</th>
                <th className="p-3 text-left sm:p-4">Valor</th>
                <th className="p-3 text-left sm:p-4">Status</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-sm text-slate-500"
                  >
                    Nenhum lançamento financeiro encontrado.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="p-3 sm:p-4">{entry.descricao}</td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          entry.tipo === "Despesa"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {entry.tipo || "Receita"}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      {formatCurrency(entry.valor)}
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
                            onClick={() => onReceive(entry.id)}
                            className="text-green-600"
                          >
                            Dar Baixa
                          </button>
                        )}

                        <button
                          onClick={() => setEntryToDelete(entry)}
                          className="text-red-600"
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
        isOpen={Boolean(entryToDelete)}
        title="Excluir lançamento"
        description={`Deseja excluir ${entryToDelete?.descricao}?`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </>
  );
}
