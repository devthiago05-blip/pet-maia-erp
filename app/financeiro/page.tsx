"use client";

import { Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditFinancialModal } from "@/components/financeiro/EditFinancialModal";
import { FinancialTable } from "@/components/financeiro/FinancialTable";
import { NewFinancialModal } from "@/components/financeiro/NewFinancialModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { getFinancialOriginLabel } from "@/lib/financial-origin";
import { formatCurrency, formatDate } from "@/lib/formatters";
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
  const [tutorFilter, setTutorFilter] = useState("Todos");
  const [petFilter, setPetFilter] = useState("Todos");
  const [originFilter, setOriginFilter] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function setTodayFilter() {
    const today = new Date().toLocaleDateString("en-CA");

    setStartDate(today);
    setEndDate(today);
  }

  function setCurrentMonthFilter() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDay.toLocaleDateString("en-CA"));
    setEndDate(lastDay.toLocaleDateString("en-CA"));
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("Todos");
    setStatusFilter("Todos");
    setTutorFilter("Todos");
    setPetFilter("Todos");
    setOriginFilter("Todos");
    setStartDate("");
    setEndDate("");
  }

  const originOptions = useMemo(() => {
    const origins = entries
      .map((entry) => entry.origem || "manual")
      .filter(Boolean);

    return Array.from(new Set(origins)).sort((first, second) =>
      getFinancialOriginLabel(first).localeCompare(
        getFinancialOriginLabel(second),
        "pt-BR",
      ),
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const date = entry.created_at?.slice(0, 10) || "";
      const origin = entry.origem || "manual";

      return (
        (!term ||
          entry.descricao.toLowerCase().includes(term) ||
          entry.tutors?.nome?.toLowerCase().includes(term) ||
          entry.pets?.nome?.toLowerCase().includes(term)) &&
        (typeFilter === "Todos" || entry.tipo === typeFilter) &&
        (statusFilter === "Todos" || entry.status_pagamento === statusFilter) &&
        (tutorFilter === "Todos" ||
          String(entry.tutor_id || "") === tutorFilter) &&
        (petFilter === "Todos" || String(entry.pet_id || "") === petFilter) &&
        (originFilter === "Todos" || origin === originFilter) &&
        (!startDate || date >= startDate) &&
        (!endDate || date <= endDate)
      );
    });
  }, [
    endDate,
    entries,
    originFilter,
    petFilter,
    search,
    startDate,
    statusFilter,
    tutorFilter,
    typeFilter,
  ]);

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

  const totalDespesasPagas = filteredEntries
    .filter(
      (entry) => entry.tipo === "Despesa" && entry.status_pagamento === "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const totalDespesasPendentes = filteredEntries
    .filter(
      (entry) =>
        entry.tipo === "Despesa" && entry.status_pagamento === "Pendente",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);

  const totalDespesas = totalDespesasPagas + totalDespesasPendentes;
  const saldoRealizado = totalRecebido - totalDespesasPagas;
  const saldoPrevisto = totalRecebido + totalReceber - totalDespesas;
  const todayIso = new Date().toLocaleDateString("en-CA");
  const overdueExpenses = filteredEntries.filter((entry) => {
    return (
      entry.tipo === "Despesa" &&
      entry.status_pagamento === "Pendente" &&
      Boolean(entry.data_vencimento) &&
      String(entry.data_vencimento).slice(0, 10) < todayIso
    );
  });
  const originSummary = useMemo(() => {
    const summary = filteredEntries.reduce<
      Record<string, { receitas: number; despesas: number; total: number }>
    >((totals, entry) => {
      const origin = entry.origem || "manual";

      if (!totals[origin]) {
        totals[origin] = { receitas: 0, despesas: 0, total: 0 };
      }

      const value = Number(entry.valor || 0);

      if (entry.tipo === "Despesa") {
        totals[origin].despesas += value;
        totals[origin].total -= value;
      } else {
        totals[origin].receitas += value;
        totals[origin].total += value;
      }

      return totals;
    }, {});

    return Object.entries(summary).sort(
      (first, second) => Math.abs(second[1].total) - Math.abs(first[1].total),
    );
  }, [filteredEntries]);

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

  function handlePrintFinancialEntries() {
    window.print();
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 print:hidden sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Financeiro
              </h1>

              <p className="text-slate-500">Controle financeiro da clínica</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handlePrintFinancialEntries}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#8A0EEA]/20 bg-white px-4 py-2 font-semibold text-[#8A0EEA] transition hover:bg-purple-50 sm:w-auto"
              >
                <Printer size={18} />
                Imprimir
              </button>

              <NewFinancialModal
                tutors={tutors}
                pets={pets}
                onSave={handleCreateEntry}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <SummaryCard
              title="Recebido"
              value={formatCurrency(totalRecebido)}
              tone="success"
            />
            <SummaryCard
              title="A Receber"
              value={formatCurrency(totalReceber)}
              tone="warning"
            />
            <SummaryCard
              title="Despesas pagas"
              value={formatCurrency(totalDespesasPagas)}
              tone="danger"
            />
            <SummaryCard
              title="Despesas pendentes"
              value={formatCurrency(totalDespesasPendentes)}
              tone="warning"
            />
            <SummaryCard
              title="Saldo realizado"
              value={formatCurrency(saldoRealizado)}
              tone={saldoRealizado >= 0 ? "success" : "danger"}
            />
            <SummaryCard
              title="Saldo previsto"
              value={formatCurrency(saldoPrevisto)}
              tone={saldoPrevisto >= 0 ? "success" : "danger"}
            />
          </div>

          {overdueExpenses.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Existem {overdueExpenses.length} despesa(s) vencida(s) pendente(s)
              no filtro atual, somando{" "}
              {formatCurrency(
                overdueExpenses.reduce(
                  (total, entry) => total + Number(entry.valor),
                  0,
                ),
              )}
              .
            </div>
          )}

          {loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="space-y-3 rounded-xl border bg-white p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={setTodayFilter}
                className="rounded-full border px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={setCurrentMonthFilter}
                className="rounded-full border px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Este mes
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-[#8A0EEA]/20 px-3 py-1.5 text-sm font-semibold text-[#8A0EEA] transition hover:bg-purple-50"
              >
                Limpar filtros
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
              <select
                value={tutorFilter}
                onChange={(event) => setTutorFilter(event.target.value)}
                className="rounded-xl border p-3"
              >
                <option value="Todos">Todos os tutores</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.nome}
                  </option>
                ))}
              </select>
              <select
                value={petFilter}
                onChange={(event) => setPetFilter(event.target.value)}
                className="rounded-xl border p-3"
              >
                <option value="Todos">Todos os pets</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.nome}
                  </option>
                ))}
              </select>
              <select
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value)}
                className="rounded-xl border p-3"
              >
                <option value="Todos">Todas as origens</option>
                {originOptions.map((origin) => (
                  <option key={origin} value={origin}>
                    {getFinancialOriginLabel(origin)}
                  </option>
                ))}
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
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-800">Resumo por origem</h2>
                <p className="text-sm text-slate-500">
                  Valores calculados com os filtros atuais
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {originSummary.length}
              </span>
            </div>

            {originSummary.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-slate-500">
                Nenhuma origem encontrada no filtro atual.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {originSummary.map(([origin, totals]) => (
                  <div key={origin} className="rounded-xl border p-4">
                    <p className="font-semibold text-slate-800">
                      {getFinancialOriginLabel(origin)}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Receitas</p>
                        <p className="font-semibold text-green-700">
                          {formatCurrency(totals.receitas)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Despesas</p>
                        <p className="font-semibold text-red-700">
                          {formatCurrency(totals.despesas)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Saldo</p>
                        <p
                          className={`font-semibold ${
                            totals.total >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatCurrency(totals.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        <FinancialPrintView
          entries={filteredEntries}
          saldoPrevisto={saldoPrevisto}
          saldoRealizado={saldoRealizado}
          totalDespesas={totalDespesas}
          totalDespesasPagas={totalDespesasPagas}
          totalDespesasPendentes={totalDespesasPendentes}
          totalReceber={totalReceber}
          totalRecebido={totalRecebido}
        />
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    neutral: "border-slate-200 bg-white text-slate-900",
    success: "border-green-100 bg-green-50 text-green-800",
    warning: "border-yellow-100 bg-yellow-50 text-yellow-800",
    danger: "border-red-100 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <h2 className="mt-2 text-xl font-bold sm:text-2xl">{value}</h2>
    </div>
  );
}

function FinancialPrintView({
  entries,
  saldoPrevisto,
  saldoRealizado,
  totalDespesas,
  totalDespesasPagas,
  totalDespesasPendentes,
  totalReceber,
  totalRecebido,
}: {
  entries: FinancialEntry[];
  saldoPrevisto: number;
  saldoRealizado: number;
  totalDespesas: number;
  totalDespesasPagas: number;
  totalDespesasPendentes: number;
  totalReceber: number;
  totalRecebido: number;
}) {
  const printedAt = new Date().toLocaleString("pt-BR");

  return (
    <section className="document-print-area hidden bg-white p-8 print:block">
      <div className="mb-6 border-b-2 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          PET MAIA ERP
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Relatorio financeiro
        </h1>
        <p className="mt-1 text-sm text-slate-500">Impresso em {printedAt}</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 text-sm">
        <PrintSummary label="Recebido" value={formatCurrency(totalRecebido)} />
        <PrintSummary label="A receber" value={formatCurrency(totalReceber)} />
        <PrintSummary
          label="Despesas pagas"
          value={formatCurrency(totalDespesasPagas)}
        />
        <PrintSummary
          label="Despesas pendentes"
          value={formatCurrency(totalDespesasPendentes)}
        />
        <PrintSummary
          label="Total despesas"
          value={formatCurrency(totalDespesas)}
        />
        <PrintSummary
          label="Saldo realizado"
          value={formatCurrency(saldoRealizado)}
        />
        <PrintSummary
          label="Saldo previsto"
          value={formatCurrency(saldoPrevisto)}
        />
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Descricao</th>
            <th className="border p-2">Tutor</th>
            <th className="border p-2">Pet</th>
            <th className="border p-2">Origem</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Valor</th>
            <th className="border p-2">Data do titulo</th>
            <th className="border p-2">Vencimento</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td className="border p-4 text-center" colSpan={9}>
                Nenhum lancamento financeiro encontrado.
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id}>
                <td className="border p-2">{entry.descricao}</td>
                <td className="border p-2">{entry.tutors?.nome || "-"}</td>
                <td className="border p-2">{entry.pets?.nome || "-"}</td>
                <td className="border p-2">
                  {getFinancialOriginLabel(entry.origem)}
                </td>
                <td className="border p-2">{entry.tipo || "Receita"}</td>
                <td className="border p-2">{formatCurrency(entry.valor)}</td>
                <td className="border p-2">{formatDate(entry.created_at)}</td>
                <td className="border p-2">
                  {entry.tipo === "Despesa"
                    ? formatDate(entry.data_vencimento)
                    : "-"}
                </td>
                <td className="border p-2">{entry.status_pagamento}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

function PrintSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="border p-3">
      <p className="text-[10px] font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
