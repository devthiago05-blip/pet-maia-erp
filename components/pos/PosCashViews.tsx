"use client";

import { Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  formatCashMovementType,
  getCashMovements,
  getCashPaymentSummary,
  type ManualCashMovementType,
  PrintMetric,
  sumCashMovements,
  Summary,
} from "@/components/pos/pos-page-shared";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { PosCashRegister } from "@/types/domain";
export function CashRegisterView({
  cashRegisters,
  openCashRegister,
  onOpen,
  onMovement,
  onClose,
}: {
  cashRegisters: PosCashRegister[];
  openCashRegister: PosCashRegister | null;
  onOpen: (input: { openingAmount: number; notes: string }) => Promise<void>;
  onMovement: (input: {
    movementType: ManualCashMovementType;
    amount: number;
    notes: string;
  }) => Promise<void>;
  onClose: (input: { closingAmount: number; notes: string }) => Promise<void>;
}) {
  const [openingAmount, setOpeningAmount] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [movementType, setMovementType] =
    useState<ManualCashMovementType>("suprimento");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementNotes, setMovementNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [registerToPrint, setRegisterToPrint] =
    useState<PosCashRegister | null>(null);

  const openMovements = openCashRegister
    ? getCashMovements(openCashRegister)
    : [];

  function printRegister(register: PosCashRegister) {
    setRegisterToPrint(register);
    window.addEventListener("afterprint", () => setRegisterToPrint(null), {
      once: true,
    });
    window.setTimeout(() => window.print(), 100);
  }

  async function submitOpen() {
    const amount = Number(openingAmount || 0);

    if (amount < 0) {
      toast.error("Informe um valor de abertura válido");
      return;
    }

    setProcessing(true);
    try {
      await onOpen({ openingAmount: amount, notes: openingNotes });
      setOpeningAmount("");
      setOpeningNotes("");
    } finally {
      setProcessing(false);
    }
  }

  async function submitMovement() {
    const amount = Number(movementAmount || 0);

    if (amount <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }

    setProcessing(true);
    try {
      await onMovement({ movementType, amount, notes: movementNotes });
      setMovementAmount("");
      setMovementNotes("");
    } finally {
      setProcessing(false);
    }
  }

  async function submitClose() {
    const amount = Number(closingAmount || 0);

    if (amount < 0) {
      toast.error("Informe um valor de fechamento válido");
      return;
    }

    setProcessing(true);
    try {
      await onClose({ closingAmount: amount, notes: closingNotes });
      setClosingAmount("");
      setClosingNotes("");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <CashDashboard cashRegisters={cashRegisters} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <div className="rounded-xl border bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Caixa do PDV</h2>
                <p className="text-sm text-slate-500">
                  Controle de abertura, suprimento, sangria e fechamento.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {openCashRegister && (
                  <button
                    type="button"
                    onClick={() => printRegister(openCashRegister)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                  >
                    <Printer size={16} />
                    Imprimir caixa
                  </button>
                )}
                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                    openCashRegister
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {openCashRegister ? "Aberto" : "Fechado"}
                </span>
              </div>
            </div>

            {openCashRegister ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Summary
                  label="Abertura"
                  value={Number(openCashRegister.opening_amount || 0)}
                  currency
                />
                <Summary
                  label="Esperado"
                  value={Number(openCashRegister.expected_amount || 0)}
                  currency
                />
                <Summary label="Movimentos" value={openMovements.length} />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingAmount}
                  onChange={(event) => setOpeningAmount(event.target.value)}
                  placeholder="Valor inicial"
                  className="rounded-xl border bg-white p-3"
                />
                <input
                  value={openingNotes}
                  onChange={(event) => setOpeningNotes(event.target.value)}
                  placeholder="Observação"
                  className="rounded-xl border bg-white p-3"
                />
                <button
                  type="button"
                  onClick={submitOpen}
                  disabled={processing}
                  className="rounded-xl bg-[#8A0EEA] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Abrir caixa
                </button>
              </div>
            )}
          </div>

          {openCashRegister && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-white p-4 sm:p-5">
                <h3 className="font-bold">Suprimento ou sangria</h3>
                <div className="mt-4 grid gap-3">
                  <select
                    value={movementType}
                    onChange={(event) =>
                      setMovementType(
                        event.target.value as ManualCashMovementType,
                      )
                    }
                    className="rounded-xl border p-3"
                  >
                    <option value="suprimento">Suprimento</option>
                    <option value="sangria">Sangria</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={movementAmount}
                    onChange={(event) => setMovementAmount(event.target.value)}
                    placeholder="Valor"
                    className="rounded-xl border p-3"
                  />
                  <input
                    value={movementNotes}
                    onChange={(event) => setMovementNotes(event.target.value)}
                    placeholder="Motivo"
                    className="rounded-xl border p-3"
                  />
                  <button
                    type="button"
                    onClick={submitMovement}
                    disabled={processing}
                    className="rounded-xl border py-3 font-semibold disabled:opacity-50"
                  >
                    Registrar movimentação
                  </button>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4 sm:p-5">
                <h3 className="font-bold">Fechamento</h3>
                <div className="mt-4 grid gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={closingAmount}
                    onChange={(event) => setClosingAmount(event.target.value)}
                    placeholder="Valor contado no caixa"
                    className="rounded-xl border p-3"
                  />
                  <input
                    value={closingNotes}
                    onChange={(event) => setClosingNotes(event.target.value)}
                    placeholder="Observação de fechamento"
                    className="rounded-xl border p-3"
                  />
                  <button
                    type="button"
                    onClick={submitClose}
                    disabled={processing}
                    className="rounded-xl bg-slate-900 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Fechar caixa
                  </button>
                </div>
              </div>
            </div>
          )}

          {openCashRegister && (
            <div className="overflow-hidden rounded-xl border bg-white">
              <div className="border-b p-4">
                <h3 className="font-bold">Movimentações do caixa aberto</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4 text-left">Data</th>
                      <th className="p-4 text-left">Tipo</th>
                      <th className="p-4 text-left">Valor</th>
                      <th className="p-4 text-left">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openMovements.map((movement) => (
                      <tr key={movement.id} className="border-t">
                        <td className="p-4">
                          {formatDate(movement.created_at)}
                        </td>
                        <td className="p-4">
                          {formatCashMovementType(movement.movement_type)}
                        </td>
                        <td className="p-4">
                          {formatCurrency(movement.amount)}
                        </td>
                        <td className="p-4">{movement.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border bg-white p-4 sm:p-5">
          <h3 className="font-bold">Histórico recente</h3>
          <div className="mt-4 space-y-3">
            {cashRegisters.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Nenhum caixa registrado.
              </p>
            ) : (
              cashRegisters.slice(0, 8).map((register) => (
                <div key={register.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        Caixa #{String(register.id).padStart(6, "0")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(register.opened_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          register.status === "Aberto"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {register.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => printRegister(register)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A0EEA]"
                      >
                        <Printer size={13} />
                        Imprimir
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Esperado</span>
                    <strong className="text-right">
                      {formatCurrency(register.expected_amount)}
                    </strong>
                    {register.status === "Fechado" && (
                      <>
                        <span className="text-slate-500">Diferença</span>
                        <strong
                          className={`text-right ${
                            Number(register.difference_amount || 0) !== 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {formatCurrency(register.difference_amount || 0)}
                        </strong>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {registerToPrint && (
        <CashRegisterPrintDocument register={registerToPrint} />
      )}
    </>
  );
}

function CashDashboard({
  cashRegisters,
}: {
  cashRegisters: PosCashRegister[];
}) {
  const now = new Date();
  const [startDate, setStartDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [endDate, setEndDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
  );
  const [operatorId, setOperatorId] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [dashboardToPrint, setDashboardToPrint] = useState(false);

  const operators = useMemo(() => {
    const uniqueOperators = new Map<string, string>();

    cashRegisters.forEach((register) => {
      if (register.opened_by) {
        uniqueOperators.set(
          register.opened_by,
          register.user_profiles?.nome ||
            `Operador ${register.opened_by.slice(0, 8)}`,
        );
      }
    });

    return Array.from(uniqueOperators.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
  }, [cashRegisters]);

  const filteredRegisters = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return cashRegisters.filter((register) => {
      const openedAt = new Date(register.opened_at);

      return (
        (!start || openedAt >= start) &&
        (!end || openedAt <= end) &&
        (operatorId === "todos" || register.opened_by === operatorId) &&
        (status === "todos" || register.status === status)
      );
    });
  }, [cashRegisters, endDate, operatorId, startDate, status]);

  const totals = useMemo(() => {
    const paymentMethods = new Map<string, number>();
    let sales = 0;
    let cancellations = 0;
    let supplies = 0;
    let withdrawals = 0;
    let expected = 0;
    let counted = 0;
    let difference = 0;

    filteredRegisters.forEach((register) => {
      sales += sumCashMovements(register, "venda");
      cancellations += sumCashMovements(register, "cancelamento_venda");
      supplies += sumCashMovements(register, "suprimento");
      withdrawals += sumCashMovements(register, "sangria");
      expected += Number(register.expected_amount || 0);

      if (register.status === "Fechado") {
        counted += Number(register.closing_amount || 0);
        difference += Number(register.difference_amount || 0);
      }

      getCashPaymentSummary(register).forEach((payment) => {
        paymentMethods.set(
          payment.method,
          (paymentMethods.get(payment.method) || 0) + payment.amount,
        );
      });
    });

    return {
      sales,
      cancellations,
      supplies,
      withdrawals,
      expected,
      counted,
      difference,
      paymentMethods: Array.from(paymentMethods.entries())
        .map(([method, amount]) => ({ method, amount }))
        .filter((payment) => Math.abs(payment.amount) >= 0.01)
        .sort((first, second) => second.amount - first.amount),
    };
  }, [filteredRegisters]);

  function printDashboard() {
    setDashboardToPrint(true);
    window.addEventListener("afterprint", () => setDashboardToPrint(false), {
      once: true,
    });
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <>
      <section className="mb-6 space-y-5 rounded-xl border bg-white p-4 sm:p-5 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Dashboard do caixa</h2>
            <p className="text-sm text-slate-500">
              Acompanhe resultados por período e operador.
            </p>
          </div>
          <button
            type="button"
            onClick={printDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-[#8A0EEA]"
          >
            <Printer size={16} />
            Imprimir relatório
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Data inicial
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Data final
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Operador
            <select
              value={operatorId}
              onChange={(event) => setOperatorId(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            >
              <option value="todos">Todos os operadores</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            >
              <option value="todos">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Fechado">Fechado</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label="Caixas" value={filteredRegisters.length} />
          <Summary label="Vendas" value={totals.sales} currency />
          <Summary
            label="Cancelamentos"
            value={totals.cancellations}
            currency
          />
          <Summary label="Esperado" value={totals.expected} currency />
          <Summary label="Contado" value={totals.counted} currency />
          <Summary label="Diferença" value={totals.difference} currency />
          <Summary label="Suprimentos" value={totals.supplies} currency />
          <Summary label="Sangrias" value={totals.withdrawals} currency />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.45fr)]">
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Caixa</th>
                  <th className="p-3 text-left">Operador</th>
                  <th className="p-3 text-left">Abertura</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Vendas</th>
                  <th className="p-3 text-right">Esperado</th>
                  <th className="p-3 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegisters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-5 text-center text-slate-500">
                      Nenhum caixa encontrado nos filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredRegisters.map((register) => (
                    <tr key={register.id} className="border-t">
                      <td className="p-3 font-medium">
                        #{String(register.id).padStart(6, "0")}
                      </td>
                      <td className="p-3">
                        {register.user_profiles?.nome ||
                          (register.opened_by
                            ? `Operador ${register.opened_by.slice(0, 8)}`
                            : "-")}
                      </td>
                      <td className="p-3">{formatDate(register.opened_at)}</td>
                      <td className="p-3">{register.status}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(sumCashMovements(register, "venda"))}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(register.expected_amount)}
                      </td>
                      <td className="p-3 text-right">
                        {register.status === "Fechado"
                          ? formatCurrency(register.difference_amount || 0)
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-bold">Formas de pagamento</h3>
            <div className="mt-3 space-y-2">
              {totals.paymentMethods.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma venda encontrada.
                </p>
              ) : (
                totals.paymentMethods.map((payment) => (
                  <div
                    key={payment.method}
                    className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                  >
                    <span>{payment.method}</span>
                    <strong>{formatCurrency(payment.amount)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {dashboardToPrint && (
        <CashDashboardPrintDocument
          registers={filteredRegisters}
          startDate={startDate}
          endDate={endDate}
          totals={totals}
        />
      )}
    </>
  );
}

function CashDashboardPrintDocument({
  registers,
  startDate,
  endDate,
  totals,
}: {
  registers: PosCashRegister[];
  startDate: string;
  endDate: string;
  totals: {
    sales: number;
    cancellations: number;
    supplies: number;
    withdrawals: number;
    expected: number;
    counted: number;
    difference: number;
    paymentMethods: Array<{ method: string; amount: number }>;
  };
}) {
  return (
    <section className="document-print-area hidden bg-white p-8 text-slate-950 print:block">
      <header className="border-b-4 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          Clínica Veterinária Pet Maia
        </p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard do caixa</h1>
        <p className="mt-1 text-sm text-slate-600">
          Período: {startDate || "início"} até {endDate || "hoje"} · Emitido em{" "}
          {formatDate(new Date().toISOString())}
        </p>
      </header>

      <div className="mt-6 grid grid-cols-4 gap-3">
        <PrintMetric label="Caixas" textValue={String(registers.length)} />
        <PrintMetric label="Vendas" value={totals.sales} />
        <PrintMetric label="Cancelamentos" value={totals.cancellations} />
        <PrintMetric label="Esperado" value={totals.expected} />
        <PrintMetric label="Contado" value={totals.counted} />
        <PrintMetric label="Diferença" value={totals.difference} />
        <PrintMetric label="Suprimentos" value={totals.supplies} />
        <PrintMetric label="Sangrias" value={totals.withdrawals} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {totals.paymentMethods.map((payment) => (
          <div
            key={payment.method}
            className="flex justify-between border p-3 text-sm"
          >
            <span>{payment.method}</span>
            <strong>{formatCurrency(payment.amount)}</strong>
          </div>
        ))}
      </div>

      <table className="mt-6 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Caixa</th>
            <th className="border p-2">Operador</th>
            <th className="border p-2">Abertura</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Vendas</th>
            <th className="border p-2">Esperado</th>
            <th className="border p-2">Diferença</th>
          </tr>
        </thead>
        <tbody>
          {registers.map((register) => (
            <tr key={register.id}>
              <td className="border p-2">
                #{String(register.id).padStart(6, "0")}
              </td>
              <td className="border p-2">
                {register.user_profiles?.nome ||
                  (register.opened_by
                    ? `Operador ${register.opened_by.slice(0, 8)}`
                    : "-")}
              </td>
              <td className="border p-2">{formatDate(register.opened_at)}</td>
              <td className="border p-2">{register.status}</td>
              <td className="border p-2">
                {formatCurrency(sumCashMovements(register, "venda"))}
              </td>
              <td className="border p-2">
                {formatCurrency(register.expected_amount)}
              </td>
              <td className="border p-2">
                {register.status === "Fechado"
                  ? formatCurrency(register.difference_amount || 0)
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CashRegisterPrintDocument({
  register,
}: {
  register: PosCashRegister;
}) {
  const movements = getCashMovements(register);
  const openingAmount = Number(register.opening_amount || 0);
  const salesAmount = sumCashMovements(register, "venda");
  const canceledSalesAmount = sumCashMovements(register, "cancelamento_venda");
  const supplyAmount = sumCashMovements(register, "suprimento");
  const withdrawalAmount = sumCashMovements(register, "sangria");
  const expectedAmount = Number(register.expected_amount || 0);
  const closingAmount = Number(register.closing_amount || 0);
  const differenceAmount = Number(register.difference_amount || 0);
  const paymentSummary = getCashPaymentSummary(register);

  return (
    <section className="cash-print-area hidden bg-white p-8 text-slate-950 print:block">
      <header className="flex items-start justify-between border-b-4 border-[#8A0EEA] pb-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
            Clinica Veterinaria Pet Maia
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            Relatorio de fechamento de caixa
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Caixa #{String(register.id).padStart(6, "0")} - {register.status}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>Aberto em: {formatDate(register.opened_at)}</p>
          <p>
            Fechado em:{" "}
            {register.closed_at ? formatDate(register.closed_at) : "-"}
          </p>
          <p>Emitido em: {formatDate(new Date().toISOString())}</p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <PrintMetric label="Abertura" value={openingAmount} />
        <PrintMetric label="Vendas" value={salesAmount} />
        <PrintMetric label="Cancelamentos" value={canceledSalesAmount} />
        <PrintMetric label="Suprimentos" value={supplyAmount} />
        <PrintMetric label="Sangrias" value={withdrawalAmount} />
        <PrintMetric label="Esperado" value={expectedAmount} />
        <PrintMetric label="Valor contado" value={closingAmount} />
        <PrintMetric label="Diferenca" value={differenceAmount} />
        <PrintMetric label="Movimentos" textValue={String(movements.length)} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-300">
        <div className="border-b border-slate-300 bg-slate-100 p-3 font-semibold">
          Totais por forma de pagamento
        </div>
        <div className="grid grid-cols-2 gap-3 p-3">
          {paymentSummary.length === 0 ? (
            <p className="col-span-2 text-sm text-slate-500">
              Nenhuma venda vinculada ao caixa.
            </p>
          ) : (
            paymentSummary.map((item) => (
              <div
                key={item.method}
                className="flex justify-between rounded-lg border border-slate-200 p-3 text-sm"
              >
                <span>{item.method}</span>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-300">
        <div className="border-b border-slate-300 bg-slate-100 p-3 font-semibold">
          Movimentacoes
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Observacao</th>
              <th className="p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500">
                  Nenhuma movimentacao registrada.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className="border-b border-slate-200">
                  <td className="p-3">{formatDate(movement.created_at)}</td>
                  <td className="p-3">
                    {formatCashMovementType(movement.movement_type)}
                  </td>
                  <td className="p-3">{movement.notes || "-"}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(movement.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-10 grid grid-cols-2 gap-8 text-sm">
        <div className="border-t border-slate-400 pt-2">
          Responsavel pelo caixa
        </div>
        <div className="border-t border-slate-400 pt-2">Conferencia</div>
      </footer>
    </section>
  );
}


