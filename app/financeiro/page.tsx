"use client";

import { useState } from "react";

import { FinancialTable } from "@/components/financeiro/FinancialTable";
import { NewFinancialModal } from "@/components/financeiro/NewFinancialModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  createFinancialEntry,
  deleteFinancialEntry,
  fetchFinancialEntries,
  markFinancialEntryAsPaid,
} from "@/services/financial";
import type { FinancialEntry, NewFinancialEntryInput } from "@/types/domain";

export default function FinanceiroPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);

  const totalRecebido = entries
    .filter(
      (entry) => entry.tipo === "Receita" && entry.status_pagamento === "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const totalReceber = entries
    .filter(
      (entry) =>
        entry.tipo === "Receita" && entry.status_pagamento === "Pendente",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const totalDespesas = entries
    .filter((entry) => entry.tipo === "Despesa")
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const lucro = totalRecebido - totalDespesas;

  async function loadFinancial() {
    const { data, error } = await fetchFinancialEntries();

    if (error) {
      console.error(error);
      return;
    }

    setEntries(data || []);
  }

  useMountEffect(() => {
    loadFinancial();
  });

  async function handleCreateEntry(novoLancamento: NewFinancialEntryInput) {
    const { error } = await createFinancialEntry(novoLancamento);

    if (error) {
      console.error(error);
      alert("Erro ao salvar lançamento");
      return;
    }

    alert("Lançamento salvo com sucesso!");
    await loadFinancial();
  }

  async function handleReceiveEntry(id: number) {
    const { error } = await markFinancialEntryAsPaid(id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadFinancial();
  }

  async function handleDeleteEntry(id: number) {
    const confirmar = window.confirm("Deseja excluir este lançamento?");

    if (!confirmar) {
      return;
    }

    const { error } = await deleteFinancialEntry(id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setEntries(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Financeiro
              </h1>

              <p className="text-slate-500">Controle financeiro da clínica</p>
            </div>

            <NewFinancialModal onSave={handleCreateEntry} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <p className="text-slate-500">Recebido</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                R$ {totalRecebido.toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <p className="text-slate-500">A Receber</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                R$ {totalReceber.toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <p className="text-slate-500">Lucro</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                R$ {lucro.toFixed(2)}
              </h2>
            </div>
          </div>

          <FinancialTable
            entries={entries}
            onReceive={handleReceiveEntry}
            onDelete={handleDeleteEntry}
          />
        </div>
      </main>
    </div>
  );
}
