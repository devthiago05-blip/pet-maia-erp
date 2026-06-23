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
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="w-full overflow-x-auto">
        <table className="min-w-[780px] w-full">
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
            {entries.map((entry) => (
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
                <td className="p-3 sm:p-4">R$ {entry.valor}</td>
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
                      onClick={() => {
                        const confirmar = window.confirm("Excluir lançamento?");

                        if (confirmar) {
                          onDelete(entry.id);
                        }
                      }}
                      className="text-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
