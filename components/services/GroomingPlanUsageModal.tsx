"use client";

import { useState } from "react";
import { toast } from "sonner";

import type {
  GroomingPlanSubscription,
  GroomingPlanUsageType,
  NewGroomingPlanUsageInput,
} from "@/types/domain";

interface GroomingPlanUsageModalProps {
  subscription: GroomingPlanSubscription;
  triggerLabel: string;
  onSave: (input: NewGroomingPlanUsageInput) => void | Promise<void>;
}

function getTodayDateString() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
}

export function GroomingPlanUsageModal({
  subscription,
  triggerLabel,
  onSave,
}: GroomingPlanUsageModalProps) {
  const [open, setOpen] = useState(false);
  const [usageType, setUsageType] = useState<GroomingPlanUsageType>("Banho");
  const [usageDate, setUsageDate] = useState(getTodayDateString());
  const [benefitName, setBenefitName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  function openModal() {
    setUsageType("Banho");
    setUsageDate(getTodayDateString());
    setBenefitName(subscription.free_benefits?.[0] || "");
    setQuantity("1");
    setNotes("");
    setOpen(true);
  }

  async function handleSave() {
    const quantityNumber = Number(quantity);

    if (!usageDate) {
      toast.error("Informe a data de uso");
      return;
    }

    if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }

    if (usageType === "Benefício" && !benefitName.trim()) {
      toast.error("Informe o benefício usado");
      return;
    }

    await onSave({
      subscriptionId: subscription.id,
      usageDate,
      usageType,
      benefitName: usageType === "Benefício" ? benefitName.trim() : null,
      quantity: quantityNumber,
      notes: notes.trim() || null,
    });

    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[#8A0EEA] px-3 py-2 text-sm font-semibold text-white hover:bg-[#7600d1] sm:w-auto"
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <h2 className="mb-1 text-xl font-bold text-slate-900">
              Registrar uso
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              {subscription.pets?.nome || "Pet"} ·{" "}
              {subscription.grooming_plans?.name || "Plano mensal"}
            </p>

            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Tipo
                <select
                  value={usageType}
                  onChange={(event) =>
                    setUsageType(event.target.value as GroomingPlanUsageType)
                  }
                  className="rounded-xl border p-3 font-normal"
                >
                  <option>Banho</option>
                  <option>Benefício</option>
                </select>
              </label>

              {usageType === "Benefício" && (
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Benefício
                  <select
                    value={benefitName}
                    onChange={(event) => setBenefitName(event.target.value)}
                    className="rounded-xl border p-3 font-normal"
                  >
                    <option value="">Selecione</option>
                    {(subscription.free_benefits || []).map((benefit) => (
                      <option key={benefit} value={benefit}>
                        {benefit}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Data
                  <input
                    type="date"
                    value={usageDate}
                    onChange={(event) => setUsageDate(event.target.value)}
                    className="rounded-xl border p-3 font-normal"
                  />
                </label>

                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Quantidade
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    className="rounded-xl border p-3 font-normal"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Observações
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
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
                  Salvar uso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
