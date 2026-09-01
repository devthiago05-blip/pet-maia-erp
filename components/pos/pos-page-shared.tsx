"use client";

import { formatCurrency } from "@/lib/formatters";
import type { PaymentRequest } from "@/lib/payments/types";
import type {
  PosCashMovementType,
  PosCashRegister,
  Product,
} from "@/types/domain";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentSplit {
  id: string;
  method: string;
  amount: string;
}

export interface ProductGroup {
  key: string;
  name: string;
  category?: string;
  products: Product[];
}

export type ManualCashMovementType = Extract<
  PosCashMovementType,
  "suprimento" | "sangria"
>;

export function integratedPaymentType(
  method: string,
): PaymentRequest["paymentType"] | null {
  const normalized = method
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized === "pix") return "PIX";
  if (normalized.includes("credito")) return "Crédito";
  if (normalized.includes("debito")) return "Débito";
  if (normalized.includes("voucher")) return "Voucher";
  return null;
}

export function formatCashMovementType(type: PosCashMovementType) {
  const labels: Record<PosCashMovementType, string> = {
    abertura: "Abertura",
    suprimento: "Suprimento",
    sangria: "Sangria",
    venda: "Venda",
    cancelamento_venda: "Cancelamento de venda",
    fechamento: "Fechamento",
  };

  return labels[type];
}

export function getCashMovements(register: PosCashRegister) {
  return (
    register.pos_cash_movements
      ?.slice()
      .sort(
        (first, second) =>
          new Date(first.created_at).getTime() -
          new Date(second.created_at).getTime(),
      ) || []
  );
}

export function sumCashMovements(
  register: PosCashRegister,
  movementType: PosCashMovementType,
) {
  return getCashMovements(register)
    .filter((movement) => movement.movement_type === movementType)
    .reduce((total, movement) => total + Number(movement.amount || 0), 0);
}

export function getCashPaymentSummary(register: PosCashRegister) {
  const summary = new Map<string, number>();

  getCashMovements(register).forEach((movement) => {
    if (
      movement.movement_type !== "venda" &&
      movement.movement_type !== "cancelamento_venda"
    ) {
      return;
    }

    const sign = movement.movement_type === "cancelamento_venda" ? -1 : 1;
    const salePayments = movement.pos_sales?.pos_sale_payments || [];

    if (salePayments.length > 0) {
      salePayments.forEach((payment) => {
        const current = summary.get(payment.payment_method) || 0;
        summary.set(
          payment.payment_method,
          current + sign * Number(payment.amount || 0),
        );
      });
      return;
    }

    const method = movement.pos_sales?.forma_pagamento || "Nao informado";
    const current = summary.get(method) || 0;
    summary.set(method, current + sign * Number(movement.amount || 0));
  });

  return Array.from(summary.entries())
    .map(([method, amount]) => ({ method, amount }))
    .filter((item) => Math.abs(item.amount) >= 0.01)
    .sort((first, second) => second.amount - first.amount);
}

export function Summary({
  label,
  value,
  textValue,
  currency = false,
  warning = false,
}: {
  label: string;
  value: number;
  textValue?: string;
  currency?: boolean;
  warning?: boolean;
}) {
  const displayValue = textValue ?? (currency ? formatCurrency(value) : value);

  return (
    <div
      className={`min-w-0 rounded-2xl border bg-white p-3 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-4 ${warning ? "border-red-100 bg-gradient-to-br from-white to-red-50/50" : "border-slate-200/80"}`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 truncate text-xl font-bold sm:text-2xl ${warning ? "text-red-600" : ""}`}
      >
        {displayValue}
      </p>
    </div>
  );
}

export function PrintMetric({
  label,
  value,
  textValue,
}: {
  label: string;
  value?: number;
  textValue?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-300 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">
        {textValue ?? formatCurrency(value || 0)}
      </p>
    </div>
  );
}
