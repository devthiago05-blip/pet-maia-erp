"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditFinancialModal } from "@/components/financeiro/EditFinancialModal";
import { FinancialTable } from "@/components/financeiro/FinancialTable";
import { NewFinancialModal } from "@/components/financeiro/NewFinancialModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency } from "@/lib/formatters";
import {
  createFinancialEntry,
  deleteFinancialEntry,
  fetchFinancialEntries,
  markFinancialEntryAsPaid,
  updateFinancialEntry,
} from "@/services/financial";
import { fetchPets } from "@/services/pets";
import { fetchTutors } from "@/services/tutors";
import type {
  FinancialEntry,
  NewFinancialEntryInput,
  Pet,
  Tutor,
  UpdateFinancialEntryInput,
} from "@/types/domain";

export default function FinanceiroPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<FinancialEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const date = entry.created_at?.slice(0, 10) || "";
      return (
        (!term ||
          entry.descricao.toLowerCase().includes(term) ||
          entry.tutors?.nome?.toLowerCase().includes(term) ||
          entry.pets?.nome?.toLowerCase().includes(term)) &&
        (typeFilter === "Todos" || entry.tipo === typeFilter) &&
        (statusFilter === "Todos" || entry.status_pagamento === statusFilter) &&
        (!startDate || date >= startDate) &&
        (!endDate || date <= endDate)
      );
    });
  }, [endDate, entries, search, startDate, statusFilter, typeFilter]);

  const totalRecebido = filteredEntries
    .filter(
      (entry) => entry.tipo === "Receita" && entry.status_pagamento === "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const totalReceber = filteredEntries
    .filter(
      (entry) =>
        entry.tipo === "Receita" && entry.status_pagamento === "Pendente",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const totalDespesas = filteredEntries
    .filter((entry) => entry.tipo === "Despesa")
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const lucro = totalRecebido - totalDespesas;

  async function loadFinancial() {
    setLoading(true);
    setLoadError("");

    const [financialResponse, tutorsResponse, petsResponse] = await Promise.all(
      [fetchFinancialEntries(), fetchTutors(), fetchPets()],
    );

    if (financialResponse.error) {
      console.error(financialResponse.error);
      setLoadError("Não foi possível carregar os lançamentos financeiros.");
      setEntries([]);
      setLoading(false);
      return;
    }

    if (tutorsResponse.error) {
      console.error(tutorsResponse.error);
      toast.warning("Não foi possível carregar os tutores.");
    }

    if (petsResponse.error) {
      console.error(petsResponse.error);
      toast.warning("Não foi possível carregar os pets.");
    }

    setEntries((financialResponse.data || []) as FinancialEntry[]);
    setTutors((tutorsResponse.data || []) as Tutor[]);
    setPets((petsResponse.data || []) as Pet[]);
    setLoading(false);
  }

  useMountEffect(() => {
    loadFinancial();
  });

  async function handleCreateEntry(
    novoLancamento: NewFinancialEntryInput,
  ): Promise<boolean> {
    const { error } = await createFinancialEntry(novoLancamento);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar lançamento");
      return false;
    }

    await loadFinancial();
    toast.success("Lançamento salvo com sucesso!");
    return true;
  }

  async function handleReceiveEntry(id: number) {
    const { error } = await markFinancialEntryAsPaid(id);

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    await loadFinancial();
    toast.success("Lançamento marcado como pago!");
  }

  async function handleDeleteEntry(id: number) {
    const { error } = await deleteFinancialEntry(id);

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    setEntries(entries.filter((entry) => entry.id !== id));
    toast.success("Lançamento excluído com sucesso!");
  }
  async function handleUpdateEntry(
    id: number,
    updatedEntry: UpdateFinancialEntryInput,
  ) {
    const { error } = await updateFinancialEntry(id, updatedEntry);

    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar lançamento");
      return false;
    }

    await loadFinancial();
    toast.success("Lançamento atualizado com sucesso!");
    return true;
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

            <NewFinancialModal
              tutors={tutors}
              pets={pets}
              onSave={handleCreateEntry}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            <SummaryCard
              title="Recebido"
              value={formatCurrency(totalRecebido)}
            />
            <SummaryCard
              title="A Receber"
              value={formatCurrency(totalReceber)}
            />
            <SummaryCard title="Lucro" value={formatCurrency(lucro)} />
          </div>

          {loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="flex items-center gap-3 rounded-xl border px-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar descrição"
                className="min-w-0 flex-1 py-3 outline-none"
              />
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border p-3"
            >
              <option>Todos</option>
              <option>Receita</option>
              <option>Despesa</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border p-3"
            >
              <option>Todos</option>
              <option>Pago</option>
              <option>Pendente</option>
            </select>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Data inicial
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border p-3 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Data final
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-xl border p-3 text-sm font-normal text-slate-900"
              />
            </label>
          </div>

          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
              Carregando lançamentos financeiros...
            </div>
          ) : (
            <FinancialTable
              entries={filteredEntries}
              onReceive={handleReceiveEntry}
              onDelete={handleDeleteEntry}
              onEdit={setEntryToEdit}
            />
          )}
        </div>

        <EditFinancialModal
          entry={entryToEdit}
          tutors={tutors}
          pets={pets}
          onClose={() => setEntryToEdit(null)}
          onSave={handleUpdateEntry}
        />
      </main>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-6">
      <p className="text-slate-500">{title}</p>
      <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{value}</h2>
    </div>
  );
}
