"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type {
  FinancialEntry,
  FinancialEntryType,
  PaymentStatus,
  UpdateFinancialEntryInput,
} from "@/types/domain";

interface EditFinancialModalProps {
  entry: FinancialEntry | null;
  onClose: () => void;
  onSave: (
    id: number,
    entry: UpdateFinancialEntryInput,
  ) => Promise<boolean>;
}

export function EditFinancialModal({
  entry,
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) {
      return;
    }

    setDescricao(entry.descricao || "");
    setValor(String(entry.valor || ""));
    setTipo(entry.tipo || "Receita");
    setFormaPagamento(entry.forma_pagamento || "PIX");
    setStatusPagamento(entry.status_pagamento || "Pendente");
    setDataVencimento(entry.data_vencimento?.slice(0, 10) || "");
  }, [entry]);

  if (!entry) {
    return null;
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
  dataVencimento,
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
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5">
          <h2
            id="edit-financial-title"
            className="text-xl font-bold text-slate-900"
          >
            Editar lançamento
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Atualize os dados financeiros do lançamento.
          </p>
        </div>

        <div className="space-y-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Descrição
            <input
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className="w-full rounded-xl border p-3 font-normal"
            />
          </label>

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
                  setTipo(event.target.value as FinancialEntryType)
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

          <div className="grid gap-4 sm:grid-cols-2">
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

            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Data de vencimento
              <input
                type="date"
                value={dataVencimento}
                onChange={(event) => setDataVencimento(event.target.value)}
                className="w-full rounded-xl border p-3 font-normal"
              />
            </label>
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