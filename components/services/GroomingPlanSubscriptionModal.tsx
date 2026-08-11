"use client";

import { useState } from "react";
import { toast } from "sonner";

import type {
  GroomingPlan,
  GroomingPlanSubscription,
  GroomingPlanSubscriptionStatus,
  NewGroomingPlanSubscriptionInput,
  Pet,
} from "@/types/domain";

interface GroomingPlanSubscriptionModalProps {
  subscription?: GroomingPlanSubscription | null;
  plans: GroomingPlan[];
  pets: Pet[];
  triggerLabel: string;
  title: string;
  onSave: (
    input: NewGroomingPlanSubscriptionInput,
    subscriptionId?: number,
  ) => void | Promise<void>;
}

function getTodayDateString() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
}

function addOneMonth(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

const subscriptionStatuses: GroomingPlanSubscriptionStatus[] = [
  "Ativo",
  "Pausado",
  "Cancelado",
  "Encerrado",
];

export function GroomingPlanSubscriptionModal({
  subscription,
  plans,
  pets,
  triggerLabel,
  title,
  onSave,
}: GroomingPlanSubscriptionModalProps) {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState("");
  const [petId, setPetId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] =
    useState<GroomingPlanSubscriptionStatus>("Ativo");
  const [notes, setNotes] = useState("");

  function openModal() {
    const today = getTodayDateString();
    const defaultPlan = plans.find((plan) => plan.active) || plans[0];

    setPlanId(String(subscription?.plan_id || defaultPlan?.id || ""));
    setPetId(String(subscription?.pet_id || ""));
    setStartDate(subscription?.start_date || today);
    setNextBillingDate(subscription?.next_billing_date || addOneMonth(today));
    setEndDate(subscription?.end_date || "");
    setStatus(subscription?.status || "Ativo");
    setNotes(subscription?.notes || "");
    setOpen(true);
  }

  async function handleSave() {
    const selectedPlan = plans.find((plan) => String(plan.id) === planId);
    const selectedPet = pets.find((pet) => String(pet.id) === petId);

    if (!selectedPlan) {
      toast.error("Selecione o plano");
      return;
    }

    if (!selectedPet) {
      toast.error("Selecione o pet");
      return;
    }

    if (!startDate) {
      toast.error("Informe a data de início");
      return;
    }

    if (endDate && endDate < startDate) {
      toast.error("A data final não pode ser menor que a data inicial");
      return;
    }

    if (nextBillingDate && nextBillingDate < startDate) {
      toast.error("O vencimento não pode ser menor que a data inicial");
      return;
    }

    await onSave(
      {
        planId: selectedPlan.id,
        tutorId: selectedPet.tutor_id || null,
        petId: selectedPet.id,
        startDate,
        endDate: endDate || null,
        nextBillingDate: nextBillingDate || null,
        status,
        monthlyPrice: Number(selectedPlan.monthly_price || 0),
        bathsPerMonth: Number(selectedPlan.baths_per_month || 0),
        freeBenefits: selectedPlan.free_benefits || [],
        notes: notes.trim() || null,
      },
      subscription?.id,
    );

    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          subscription
            ? "font-semibold text-blue-600"
            : "inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
        }
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <h2 className="mb-1 text-xl font-bold text-slate-900">{title}</h2>
            <p className="mb-5 text-sm text-slate-500">
              Vincule um plano mensal a um pet e acompanhe o consumo do mês.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Plano
                <select
                  value={planId}
                  onChange={(event) => setPlanId(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                >
                  <option value="">Selecione</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Pet
                <select
                  value={petId}
                  onChange={(event) => setPetId(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                >
                  <option value="">Selecione</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.nome} - {pet.tutors?.nome || "Tutor não informado"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Início
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Próximo vencimento
                <input
                  type="date"
                  value={nextBillingDate}
                  onChange={(event) => setNextBillingDate(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Status
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as GroomingPlanSubscriptionStatus,
                    )
                  }
                  className="rounded-xl border p-3 font-normal"
                >
                  {subscriptionStatuses.map((currentStatus) => (
                    <option key={currentStatus}>{currentStatus}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Fim do plano
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                Observações
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ex.: desconto combinado, regra específica, pagamento..."
                  className="rounded-xl border p-3 font-normal"
                />
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
                  Salvar assinatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
