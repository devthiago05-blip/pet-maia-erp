"use client";

import { CalendarSync, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { financialPaymentMethods } from "@/lib/financial-options";
import { formatCurrency } from "@/lib/formatters";
import type { FinancialRecurringRule } from "@/types/domain";

export function RecurringAccountsPanel({
  rules,
  onCreate,
  onToggle,
  onDelete,
}: {
  rules: FinancialRecurringRule[];
  onCreate: (
    input: Omit<FinancialRecurringRule, "id" | "created_at" | "active">,
  ) => Promise<boolean>;
  onToggle: (rule: FinancialRecurringRule) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const today = new Date().toLocaleDateString("en-CA");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    entry_type: "Despesa" as "Receita" | "Despesa",
    payment_method: "PIX",
    day_of_month: "10",
    start_date: today,
    end_date: "",
  });
  async function submit() {
    setSaving(true);
    const success = await onCreate({
      ...form,
      amount: Number(form.amount),
      day_of_month: Number(form.day_of_month),
      end_date: form.end_date || null,
    });
    setSaving(false);
    if (success) {
      setOpen(false);
      setForm((current) => ({ ...current, description: "", amount: "" }));
    }
  }
  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-purple-50 p-2 text-[#8A0EEA]">
            <CalendarSync />
          </span>
          <div>
            <h2 className="font-bold">Contas recorrentes</h2>
            <p className="text-sm text-slate-500">
              Títulos mensais gerados automaticamente
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-2 font-semibold text-white"
        >
          <Plus size={17} />
          Nova recorrência
        </button>
      </div>
      {open && (
        <div className="mt-4 grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição"
            className="rounded-xl border p-3 lg:col-span-2"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Valor"
            className="rounded-xl border p-3"
          />
          <select
            value={form.entry_type}
            onChange={(e) =>
              setForm({
                ...form,
                entry_type: e.target.value as "Receita" | "Despesa",
              })
            }
            className="rounded-xl border p-3"
          >
            <option>Despesa</option>
            <option>Receita</option>
          </select>
          <select
            value={form.payment_method}
            onChange={(e) =>
              setForm({ ...form, payment_method: e.target.value })
            }
            className="rounded-xl border p-3"
          >
            {financialPaymentMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
          <label className="text-xs text-slate-500">
            Dia do vencimento
            <input
              type="number"
              min="1"
              max="28"
              value={form.day_of_month}
              onChange={(e) =>
                setForm({ ...form, day_of_month: e.target.value })
              }
              className="mt-1 w-full rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs text-slate-500">
            Início
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="mt-1 w-full rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs text-slate-500">
            Fim (opcional)
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="mt-1 w-full rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
          <button
            disabled={
              saving || !form.description.trim() || Number(form.amount) <= 0
            }
            onClick={() => void submit()}
            className="rounded-xl bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50 sm:col-span-2 lg:col-span-4"
          >
            {saving ? "Salvando..." : "Salvar recorrência"}
          </button>
        </div>
      )}
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {rules.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
            Nenhuma conta recorrente cadastrada.
          </p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${rule.active ? "" : "opacity-55"}`}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{rule.description}</p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(rule.amount)} · dia {rule.day_of_month} ·{" "}
                  {rule.entry_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void onToggle(rule)}
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${rule.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}
                >
                  {rule.active ? "Ativa" : "Pausada"}
                </button>
                <button
                  onClick={() => void onDelete(rule.id)}
                  aria-label="Excluir recorrência"
                  className="text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
