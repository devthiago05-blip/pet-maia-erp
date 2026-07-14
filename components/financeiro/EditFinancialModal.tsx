"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  FinancialEntry,
  FinancialEntryType,
  PaymentStatus,
  Pet,
  Tutor,
  UpdateFinancialEntryInput,
} from "@/types/domain";

interface EditFinancialModalProps {
  entry: FinancialEntry | null;
  tutors: Tutor[];
  pets: Pet[];
  onClose: () => void;
  onSave: (id: number, entry: UpdateFinancialEntryInput) => Promise<boolean>;
}

const operationalExpenseSuggestions = [
  "Manutenção de máquinas",
  "Afiação de lâmina",
  "Manutenção predial",
  "Compra de peças",
];

export function EditFinancialModal({
  entry,
  tutors,
  pets,
  onClose,
  onSave,
}: EditFinancialModalProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<FinancialEntryType>("Receita");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [statusPagamento, setStatusPagamento] =
    useState<PaymentStatus>("Pendente");
  const [dataVencimento, setDataVencimento] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [petId, setPetId] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredPets = useMemo(() => {
    if (!tutorId) {
      return pets;
    }

    return pets.filter((pet) => String(pet.tutor_id) === tutorId);
  }, [pets, tutorId]);

  useEffect(() => {
    if (!entry) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDescricao(entry.descricao || "");
      setValor(String(entry.valor || ""));
      setTipo(entry.tipo || "Receita");
      setFormaPagamento(entry.forma_pagamento || "PIX");
      setStatusPagamento(entry.status_pagamento || "Pendente");
      setDataVencimento(entry.data_vencimento?.slice(0, 10) || "");
      setTutorId(entry.tutor_id ? String(entry.tutor_id) : "");
      setPetId(entry.pet_id ? String(entry.pet_id) : "");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [entry]);

  if (!entry) {
    return null;
  }

  function handleTutorChange(value: string) {
    setTutorId(value);

    if (!value) {
      return;
    }

    const selectedPet = pets.find((pet) => String(pet.id) === petId);

    if (selectedPet?.tutor_id && String(selectedPet.tutor_id) !== value) {
      setPetId("");
    }
  }

  function handlePetChange(value: string) {
    setPetId(value);

    const selectedPet = pets.find((pet) => String(pet.id) === value);

    if (selectedPet?.tutor_id) {
      setTutorId(String(selectedPet.tutor_id));
    }
  }

  function handleTypeChange(value: FinancialEntryType) {
    setTipo(value);

    if (value !== "Despesa") {
      setDataVencimento("");
    }
  }

  async function handleSave() {
    const numericValue = Number(valor);

    if (!descricao.trim() || !valor.trim()) {
      toast.error("Preencha descrição e valor");
      return;
    }

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    if (!entry) {
      return;
    }

    setSaving(true);

    const success = await onSave(entry.id, {
      descricao,
      valor: numericValue,
      formaPagamento,
      tipo,
      statusPagamento,
      dataVencimento: tipo === "Despesa" ? dataVencimento : "",
      tutorId,
      petId,
    });

    setSaving(false);

    if (success) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-financial-title"
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5">
          <h2
            id="edit-financial-title"
            className="text-xl font-bold text-slate-900"
          >
            Editar lançamento
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Atualize os dados financeiros e os vínculos do lançamento.
          </p>
        </div>

        <div className="space-y-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Tutor
            <select
              value={tutorId}
              onChange={(event) => handleTutorChange(event.target.value)}
              className="w-full rounded-xl border p-3 font-normal"
            >
              <option value="">Sem tutor vinculado</option>
              {tutors.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Pet
            <select
              value={petId}
              onChange={(event) => handlePetChange(event.target.value)}
              className="w-full rounded-xl border p-3 font-normal"
            >
              <option value="">Sem pet vinculado</option>
              {filteredPets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Descrição
            <input
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className="w-full rounded-xl border p-3 font-normal"
            />
          </label>

          {tipo === "Despesa" && (
            <div className="flex flex-wrap gap-2">
              {operationalExpenseSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setDescricao(suggestion)}
                  className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#8A0EEA] transition hover:bg-purple-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Valor
            <input
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              className="w-full rounded-xl border p-3 font-normal"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Tipo
              <select
                value={tipo}
                onChange={(event) =>
                  handleTypeChange(event.target.value as FinancialEntryType)
                }
                className="w-full rounded-xl border p-3 font-normal"
              >
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Status
              <select
                value={statusPagamento}
                onChange={(event) =>
                  setStatusPagamento(event.target.value as PaymentStatus)
                }
                className="w-full rounded-xl border p-3 font-normal"
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
            </label>
          </div>

          <div
            className={`grid gap-4 ${
              tipo === "Despesa" ? "sm:grid-cols-2" : ""
            }`}
          >
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Forma de pagamento
              <select
                value={formaPagamento}
                onChange={(event) => setFormaPagamento(event.target.value)}
                className="w-full rounded-xl border p-3 font-normal"
              >
                <option>PIX</option>
                <option>Dinheiro</option>
                <option>Cartão</option>
              </select>
            </label>

            {tipo === "Despesa" && (
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Data de vencimento
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(event) => setDataVencimento(event.target.value)}
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full rounded-xl border px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white transition hover:bg-[#7600d1] disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
