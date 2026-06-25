"use client";

import {
  CalendarCheck,
  CircleDollarSign,
  PackageSearch,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency } from "@/lib/formatters";
import { fetchAppointments } from "@/services/appointments";
import { fetchFinancialEntries } from "@/services/financial";
import { fetchPets } from "@/services/pets";
import { fetchPosSales, fetchProducts } from "@/services/pos";
import { fetchTutors } from "@/services/tutors";
import type {
  Appointment,
  FinancialEntry,
  Pet,
  PosSale,
  Product,
  Tutor,
} from "@/types/domain";

export default function BiPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useMountEffect(() => {
    async function loadBi() {
      const responses = await Promise.all([
        fetchAppointments(),
        fetchFinancialEntries(),
        fetchPosSales(),
        fetchProducts(),
        fetchPets(),
        fetchTutors(),
      ]);
      const error = responses.find((response) => response.error)?.error;

      if (error) {
        console.error(error);
        setLoadError("Não foi possível carregar todos os indicadores do BI.");
        setLoading(false);
        return;
      }

      setAppointments(responses[0].data || []);
      setEntries(responses[1].data || []);
      setSales((responses[2].data || []) as PosSale[]);
      setProducts(responses[3].data || []);
      setPets(responses[4].data || []);
      setTutors(responses[5].data || []);
      setLoading(false);
    }

    loadBi();
  });

  const inPeriod = (value?: string) => {
    const date = value?.slice(0, 10) || "";
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  };
  const periodEntries = entries.filter((entry) => inPeriod(entry.created_at));
  const periodSales = sales.filter(
    (sale) => inPeriod(sale.created_at) && sale.status !== "Cancelada",
  );
  const periodAppointments = appointments.filter((appointment) =>
    inPeriod(appointment.data),
  );
  const revenue = periodEntries
    .filter(
      (entry) => entry.tipo === "Receita" && entry.status_pagamento === "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);
  const expenses = periodEntries
    .filter(
      (entry) => entry.tipo === "Despesa" && entry.status_pagamento === "Pago",
    )
    .reduce((total, entry) => total + Number(entry.valor), 0);
  const posRevenue = periodSales.reduce(
    (total, sale) => total + Number(sale.total),
    0,
  );
  const averageTicket =
    periodSales.length > 0 ? posRevenue / periodSales.length : 0;
  const lowStock = products.filter(
    (product) => product.ativo && product.estoque <= product.estoque_minimo,
  );

  const topProducts = (() => {
    const ranking = new Map<string, number>();
    periodSales.forEach((sale) =>
      (sale.pos_sale_items || []).forEach((item) =>
        ranking.set(
          item.descricao,
          (ranking.get(item.descricao) || 0) + item.quantidade,
        ),
      ),
    );
    return Array.from(ranking.entries())
      .sort((first, second) => second[1] - first[1])
      .slice(0, 6);
  })();

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              BI
            </h1>
            <p className="text-slate-500">
              Visão executiva da operação e dos resultados
            </p>
          </div>

          <div className="grid gap-4 rounded-xl border bg-white p-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              Data inicial
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border p-3 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Data final
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-xl border p-3 font-normal"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="self-end rounded-xl border py-3"
            >
              Limpar período
            </button>
          </div>

          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-slate-500">
              Carregando indicadores...
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <BiCard
                  icon={CircleDollarSign}
                  label="Receita recebida"
                  value={formatCurrency(revenue)}
                />
                <BiCard
                  icon={TrendingUp}
                  label="Resultado"
                  value={formatCurrency(revenue - expenses)}
                />
                <BiCard
                  icon={ShoppingCart}
                  label="Ticket médio PDV"
                  value={formatCurrency(averageTicket)}
                />
                <BiCard
                  icon={CalendarCheck}
                  label="Atendimentos"
                  value={String(periodAppointments.length)}
                />
                <BiCard
                  icon={Users}
                  label="Tutores / pacientes"
                  value={`${tutors.length} / ${pets.length}`}
                />
                <BiCard
                  icon={PackageSearch}
                  label="Estoque baixo"
                  value={String(lowStock.length)}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <BiList
                  title="Produtos mais vendidos"
                  items={topProducts.map(([label, value]) => ({
                    label,
                    value: `${value} un.`,
                  }))}
                />
                <BiList
                  title="Produtos com estoque baixo"
                  items={lowStock.slice(0, 8).map((product) => ({
                    label: product.nome,
                    value: `${product.estoque} un.`,
                  }))}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function BiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <Icon size={22} className="text-[#8A0EEA]" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function BiList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 divide-y">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">Nenhum dado no período.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
