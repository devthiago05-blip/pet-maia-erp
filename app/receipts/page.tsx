"use client";

import { FileText, Printer, ReceiptText } from "lucide-react";
import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ReceiptModal } from "@/components/receipts/ReceiptModal";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { fetchFinancialEntries } from "@/services/financial";
import type { FinancialEntry } from "@/types/domain";

export default function ReceiptsPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const revenueEntries = entries.filter((entry) => entry.tipo === "Receita");
  const paidEntries = revenueEntries.filter(
    (entry) => entry.status_pagamento === "Pago",
  );
  const pendingEntries = revenueEntries.filter(
    (entry) => entry.status_pagamento !== "Pago",
  );
  const totalPaid = paidEntries.reduce(
    (total, entry) => total + Number(entry.valor),
    0,
  );

  async function loadReceipts() {
    setLoading(true);
    setLoadError("");

    const { data, error } = await fetchFinancialEntries();

    if (error) {
      console.error(error);
      setEntries([]);
      setLoadError("Não foi possível carregar os recibos.");
      setLoading(false);
      return;
    }

    setEntries(data || []);
    setLoading(false);
  }

  useMountEffect(() => {
    loadReceipts();
  });

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              Recibos
            </h1>
            <p className="text-slate-500">
              Consulte e imprima comprovantes de receitas
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            <SummaryCard
              icon={<ReceiptText size={22} />}
              title="Disponíveis"
              value={String(paidEntries.length)}
            />
            <SummaryCard
              icon={<Printer size={22} />}
              title="Valor recebido"
              value={formatCurrency(totalPaid)}
            />
            <SummaryCard
              icon={<FileText size={22} />}
              title="Pendentes"
              value={String(pendingEntries.length)}
            />
          </div>

          {loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
              Carregando recibos...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-white">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left sm:p-4">Número</th>
                      <th className="p-3 text-left sm:p-4">Descrição</th>
                      <th className="p-3 text-left sm:p-4">Data</th>
                      <th className="p-3 text-left sm:p-4">Valor</th>
                      <th className="p-3 text-left sm:p-4">Status</th>
                      <th className="p-3 text-left sm:p-4">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {revenueEntries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-6 text-center text-sm text-slate-500"
                        >
                          Nenhuma receita encontrada até o momento.
                        </td>
                      </tr>
                    ) : (
                      revenueEntries.map((entry) => (
                        <tr key={entry.id} className="border-t">
                          <td className="p-3 sm:p-4">
                            #{String(entry.id).padStart(6, "0")}
                          </td>
                          <td className="p-3 sm:p-4">{entry.descricao}</td>
                          <td className="p-3 sm:p-4">
                            {formatDate(entry.created_at)}
                          </td>
                          <td className="p-3 sm:p-4">
                            {formatCurrency(entry.valor)}
                          </td>
                          <td className="p-3 sm:p-4">
                            <span
                              className={`rounded-full px-3 py-1 text-sm ${
                                entry.status_pagamento === "Pago"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {entry.status_pagamento || "Pendente"}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4">
                            {entry.status_pagamento === "Pago" ? (
                              <ReceiptModal entry={entry} />
                            ) : (
                              <span className="text-sm text-slate-400">
                                Aguardando pagamento
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
        {icon}
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className="mt-2 text-2xl font-bold">{value}</h2>
    </div>
  );
}
