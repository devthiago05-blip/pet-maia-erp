"use client";

import {
  CalendarCheck,
  CircleDollarSign,
  PackageSearch,
  Printer,
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
  const today = new Date();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [startDate, setStartDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [endDate, setEndDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  );
  const [reportToPrint, setReportToPrint] = useState(false);
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
  const pendingRevenueEntries = periodEntries.filter(
    (entry) =>
      entry.tipo === "Receita" && entry.status_pagamento === "Pendente",
  );
  const pendingRevenue = pendingRevenueEntries.reduce(
    (total, entry) => total + Number(entry.valor),
    0,
  );
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
  const topServices = Array.from(
    periodAppointments
      .filter((appointment) => appointment.status !== "Cancelado")
      .reduce((ranking, appointment) => {
        const service = appointment.servico || "Não informado";
        ranking.set(service, (ranking.get(service) || 0) + 1);
        return ranking;
      }, new Map<string, number>()),
  )
    .sort((first, second) => second[1] - first[1])
    .slice(0, 8);
  const recurringTutors = Array.from(
    periodAppointments
      .filter((appointment) => appointment.status !== "Cancelado")
      .reduce((ranking, appointment) => {
        const tutor = appointment.pets?.tutors?.nome;

        if (tutor) {
          ranking.set(tutor, (ranking.get(tutor) || 0) + 1);
        }

        return ranking;
      }, new Map<string, number>()),
  )
    .filter(([, count]) => count > 1)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 8);
  const appointmentStatus = [
    "Pendente",
    "Agendado",
    "Finalizado",
    "Cancelado",
  ].map((status) => ({
      label: status,
      value: periodAppointments.filter(
        (appointment) => appointment.status === status,
      ).length,
    }));
  const paymentMethods = Array.from(
    periodEntries
      .filter((entry) => entry.tipo === "Receita")
      .reduce((ranking, entry) => {
        const method = entry.forma_pagamento || "Não informado";
        ranking.set(method, (ranking.get(method) || 0) + Number(entry.valor));
        return ranking;
      }, new Map<string, number>()),
  ).sort((first, second) => second[1] - first[1]);
  const monthlyFinancial = Array.from(
    periodEntries.reduce((months, entry) => {
      const month = entry.created_at?.slice(0, 7);

      if (!month) {
        return months;
      }

      const current = months.get(month) || { revenue: 0, expenses: 0 };
      if (entry.tipo === "Receita" && entry.status_pagamento === "Pago") {
        current.revenue += Number(entry.valor);
      }
      if (entry.tipo === "Despesa" && entry.status_pagamento === "Pago") {
        current.expenses += Number(entry.valor);
      }
      months.set(month, current);
      return months;
    }, new Map<string, { revenue: number; expenses: number }>()),
  )
    .sort(([first], [second]) => first.localeCompare(second))
    .slice(-6)
    .map(([month, values]) => ({
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
      ...values,
    }));

  function printReport() {
    setReportToPrint(true);
    window.addEventListener("afterprint", () => setReportToPrint(false), {
      once: true,
    });
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-4 print:hidden sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                BI
              </h1>
              <p className="text-slate-500">
                Visão executiva da operação e dos resultados
              </p>
            </div>
            <button
              type="button"
              onClick={printReport}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8A0EEA]/20 bg-white px-4 py-2 font-semibold text-[#8A0EEA] disabled:opacity-50"
            >
              <Printer size={18} /> Imprimir relatório
            </button>
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
                  icon={CircleDollarSign}
                  label="A receber"
                  value={formatCurrency(pendingRevenue)}
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
                <ComparisonChart
                  title="Evolução financeira"
                  items={monthlyFinancial}
                />
                <BarChart
                  title="Status dos atendimentos"
                  items={appointmentStatus}
                  colors={[
                    "bg-blue-500",
                    "bg-amber-500",
                    "bg-emerald-500",
                    "bg-red-500",
                  ]}
                />
                <BarChart
                  title="Produtos mais vendidos"
                  items={topProducts.map(([label, value]) => ({
                    label,
                    value,
                  }))}
                  valueSuffix=" un."
                  colors={["bg-[#8A0EEA]", "bg-blue-500", "bg-emerald-500"]}
                />
                <BarChart
                  title="Serviços mais vendidos"
                  items={topServices.map(([label, value]) => ({
                    label,
                    value,
                  }))}
                  colors={["bg-[#8A0EEA]", "bg-blue-500", "bg-emerald-500"]}
                />
                <BarChart
                  title="Tutores recorrentes"
                  items={recurringTutors.map(([label, value]) => ({
                    label,
                    value,
                  }))}
                  valueSuffix=" atend."
                  colors={["bg-blue-500", "bg-[#8A0EEA]", "bg-emerald-500"]}
                />
                <BarChart
                  title="Receitas por pagamento"
                  items={paymentMethods.map(([label, value]) => ({
                    label,
                    value,
                  }))}
                  valueFormatter={formatCurrency}
                  colors={["bg-emerald-500", "bg-blue-500", "bg-amber-500"]}
                />
                <BarChart
                  title="Produtos com estoque baixo"
                  items={lowStock.slice(0, 8).map((product) => ({
                    label: product.nome,
                    value: product.estoque,
                  }))}
                  valueSuffix=" un."
                  colors={["bg-red-500", "bg-amber-500"]}
                />
              </div>
            </>
          )}
        </div>

        {reportToPrint && (
          <BiPrintReport
            startDate={startDate}
            endDate={endDate}
            revenue={revenue}
            expenses={expenses}
            pendingRevenue={pendingRevenue}
            averageTicket={averageTicket}
            appointments={periodAppointments.length}
            lowStock={lowStock}
            topProducts={topProducts}
            topServices={topServices}
            recurringTutors={recurringTutors}
            paymentMethods={paymentMethods}
          />
        )}
      </main>
    </div>
  );
}

function BiPrintReport({
  startDate,
  endDate,
  revenue,
  expenses,
  pendingRevenue,
  averageTicket,
  appointments,
  lowStock,
  topProducts,
  topServices,
  recurringTutors,
  paymentMethods,
}: {
  startDate: string;
  endDate: string;
  revenue: number;
  expenses: number;
  pendingRevenue: number;
  averageTicket: number;
  appointments: number;
  lowStock: Product[];
  topProducts: Array<[string, number]>;
  topServices: Array<[string, number]>;
  recurringTutors: Array<[string, number]>;
  paymentMethods: Array<[string, number]>;
}) {
  return (
    <section className="document-print-area hidden bg-white p-8 text-slate-950 print:block">
      <header className="border-b-4 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          Clínica Veterinária Pet Maia
        </p>
        <h1 className="mt-1 text-2xl font-bold">Relatório gerencial — BI</h1>
        <p className="mt-1 text-sm text-slate-600">
          Período: {startDate || "início"} até {endDate || "hoje"} · Emitido em {new Date().toLocaleString("pt-BR")}
        </p>
      </header>

      <div className="mt-6 grid grid-cols-4 gap-3">
        <PrintBiMetric label="Receita" value={formatCurrency(revenue)} />
        <PrintBiMetric label="Despesas" value={formatCurrency(expenses)} />
        <PrintBiMetric
          label="Resultado"
          value={formatCurrency(revenue - expenses)}
        />
        <PrintBiMetric
          label="A receber"
          value={formatCurrency(pendingRevenue)}
        />
        <PrintBiMetric
          label="Ticket médio"
          value={formatCurrency(averageTicket)}
        />
        <PrintBiMetric label="Atendimentos" value={String(appointments)} />
        <PrintBiMetric label="Estoque baixo" value={String(lowStock.length)} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5">
        <PrintRanking title="Produtos mais vendidos" items={topProducts} />
        <PrintRanking title="Serviços mais vendidos" items={topServices} />
        <PrintRanking title="Tutores recorrentes" items={recurringTutors} />
        <PrintRanking
          title="Receitas por pagamento"
          items={paymentMethods}
          currency
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-bold">Produtos com estoque baixo</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border p-2">Produto</th>
              <th className="border p-2">Categoria</th>
              <th className="border p-2">Estoque</th>
              <th className="border p-2">Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((product) => (
              <tr key={product.id}>
                <td className="border p-2">{product.nome}</td>
                <td className="border p-2">{product.categoria || "-"}</td>
                <td className="border p-2">{product.estoque}</td>
                <td className="border p-2">{product.estoque_minimo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PrintBiMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border p-3">
      <p className="text-[10px] font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}

function PrintRanking({
  title,
  items,
  currency = false,
}: {
  title: string;
  items: Array<[string, number]>;
  currency?: boolean;
}) {
  return (
    <div className="border p-3">
      <h2 className="mb-2 font-bold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum dado no período.</p>
      ) : (
        <ol className="space-y-1 text-sm">
          {items.map(([label, value], index) => (
            <li key={label} className="flex justify-between gap-3">
              <span>
                {index + 1}. {label}
              </span>
              <strong>{currency ? formatCurrency(value) : value}</strong>
            </li>
          ))}
        </ol>
      )}
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

function BarChart({
  title,
  items,
  colors,
  valueSuffix = "",
  valueFormatter,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  colors: string[];
  valueSuffix?: string;
  valueFormatter?: (value: number) => string;
}) {
  const maximum = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">Nenhum dado no período.</p>
        ) : (
          items.map((item, index) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                <span className="min-w-0 truncate">{item.label}</span>
                <strong className="shrink-0">
                  {valueFormatter
                    ? valueFormatter(item.value)
                    : `${item.value}${valueSuffix}`}
                </strong>
              </div>
              <div className="h-3 overflow-hidden rounded bg-slate-100">
                <div
                  className={`h-full rounded ${colors[index % colors.length]}`}
                  style={{
                    width: `${Math.max((item.value / maximum) * 100, item.value > 0 ? 3 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ComparisonChart({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; revenue: number; expenses: number }>;
}) {
  const maximum = Math.max(
    ...items.flatMap((item) => [item.revenue, item.expenses]),
    1,
  );

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="flex gap-4 text-xs">
          <ChartLegend color="bg-emerald-500" label="Receitas" />
          <ChartLegend color="bg-red-500" label="Despesas" />
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-5 py-4 text-sm text-slate-500">
          Nenhum dado no período.
        </p>
      ) : (
        <div className="mt-5 flex h-64 items-end gap-3 border-b border-slate-200 px-1">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-52 w-full items-end justify-center gap-1">
                <div
                  title={`Receitas: ${formatCurrency(item.revenue)}`}
                  className="w-[38%] max-w-8 rounded-t bg-emerald-500"
                  style={{
                    height: `${Math.max((item.revenue / maximum) * 100, item.revenue > 0 ? 3 : 0)}%`,
                  }}
                />
                <div
                  title={`Despesas: ${formatCurrency(item.expenses)}`}
                  className="w-[38%] max-w-8 rounded-t bg-red-500"
                  style={{
                    height: `${Math.max((item.expenses / maximum) * 100, item.expenses > 0 ? 3 : 0)}%`,
                  }}
                />
              </div>
              <span className="w-full truncate text-center text-xs text-slate-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
