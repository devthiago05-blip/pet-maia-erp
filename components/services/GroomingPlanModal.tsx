"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { GroomingPlan, NewGroomingPlanInput } from "@/types/domain";

interface GroomingPlanModalProps {
  plan?: GroomingPlan | null;
  triggerLabel: string;
  title: string;
  onSave: (plan: NewGroomingPlanInput | GroomingPlan) => void | Promise<void>;
}

function benefitsToText(benefits: string[]) {
  return benefits.join("\n");
}

function textToBenefits(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((benefit) => benefit.trim())
    .filter(Boolean);
}

export function GroomingPlanModal({
  plan,
  triggerLabel,
  title,
  onSave,
}: GroomingPlanModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(plan?.name || "");
  const [monthlyPrice, setMonthlyPrice] = useState(
    String(plan?.monthly_price || ""),
  );
  const [bathsPerMonth, setBathsPerMonth] = useState(
    String(plan?.baths_per_month || ""),
  );
  const [freeBenefits, setFreeBenefits] = useState(
    benefitsToText(plan?.free_benefits || []),
  );
  const [notes, setNotes] = useState(plan?.notes || "");
  const [active, setActive] = useState(plan?.active ?? true);

  function openModal() {
    setName(plan?.name || "");
    setMonthlyPrice(String(plan?.monthly_price || ""));
    setBathsPerMonth(String(plan?.baths_per_month || ""));
    setFreeBenefits(benefitsToText(plan?.free_benefits || []));
    setNotes(plan?.notes || "");
    setActive(plan?.active ?? true);
    setOpen(true);
  }

  function resetForm() {
    if (plan) {
      return;
    }

    setName("");
    setMonthlyPrice("");
    setBathsPerMonth("");
    setFreeBenefits("");
    setNotes("");
    setActive(true);
  }

  async function handleSave() {
    const monthlyPriceNumber = Number(monthlyPrice);
    const bathsPerMonthNumber = Number(bathsPerMonth);
    const benefits = textToBenefits(freeBenefits);

    if (!name.trim()) {
      toast.error("Informe o nome do plano");
      return;
    }

    if (!Number.isFinite(monthlyPriceNumber) || monthlyPriceNumber < 0) {
      toast.error("Informe um valor mensal válido");
      return;
    }

    if (!Number.isInteger(bathsPerMonthNumber) || bathsPerMonthNumber < 0) {
      toast.error("Informe a quantidade de banhos do mês");
      return;
    }

    if (plan) {
      await onSave({
        ...plan,
        name: name.trim(),
        monthly_price: monthlyPriceNumber,
        baths_per_month: bathsPerMonthNumber,
        free_benefits: benefits,
        notes: notes.trim() || null,
        active,
      });
    } else {
      await onSave({
        name: name.trim(),
        monthlyPrice: monthlyPriceNumber,
        bathsPerMonth: bathsPerMonthNumber,
        freeBenefits: benefits,
        notes: notes.trim() || null,
        active,
      });
    }

    setOpen(false);
    resetForm();
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          plan
            ? "font-semibold text-blue-600"
            : "inline-flex w-full items-center justify-center rounded-xl bg-[#8A0EEA] px-4 py-2 font-semibold text-white sm:w-auto"
        }
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <h2 className="mb-1 text-xl font-bold text-slate-900">{title}</h2>
            <p className="mb-5 text-sm text-slate-500">
              Cadastre pacotes mensais de banho e benefícios grátis para usar no
              atendimento.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                Nome do plano
                <input
                  placeholder="Ex.: Plano mensal banho completo"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Valor mensal
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex.: 180,00"
                  value={monthlyPrice}
                  onChange={(event) => setMonthlyPrice(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Banhos por mês
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex.: 4"
                  value={bathsPerMonth}
                  onChange={(event) => setBathsPerMonth(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                Benefícios grátis no mês
                <textarea
                  rows={4}
                  placeholder={"Ex.:\n1 hidratação\n1 escovação"}
                  value={freeBenefits}
                  onChange={(event) => setFreeBenefits(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
                <span className="text-xs font-normal text-slate-500">
                  Use uma linha para cada benefício. Também aceito separado por
                  vírgula.
                </span>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                Observações
                <textarea
                  rows={3}
                  placeholder="Regras, validade, observações internas..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 text-sm font-semibold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                  className="h-4 w-4"
                />
                Plano ativo
              </label>

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl border py-2 font-semibold sm:flex-1"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="w-full rounded-xl bg-[#8A0EEA] py-2 font-semibold text-white sm:flex-1"
                >
                  Salvar plano
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
