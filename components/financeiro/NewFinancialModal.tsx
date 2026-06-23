"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { FinancialEntryType, NewFinancialEntryInput } from "@/types/domain";

interface NewFinancialModalProps {
  onSave: (entry: NewFinancialEntryInput & { id: number }) => void;
}

export function NewFinancialModal({ onSave }: NewFinancialModalProps) {
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<FinancialEntryType>("Receita");
  const [formaPagamento, setFormaPagamento] = useState("PIX");

  function handleSave() {
    const numericValue = Number(valor);

    if (!descricao.trim() || !valor.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    onSave({
      id: Date.now(),
      descricao,
      valor: numericValue,
      formaPagamento,
      tipo,
    });

    setDescricao("");
    setValor("");
    setFormaPagamento("PIX");
    setTipo("Receita");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
      >
        Novo Lançamento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-bold">Novo Lançamento</h2>

            <div className="space-y-4">
              <input
                placeholder="Descrição"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as FinancialEntryType)
                }
                className="w-full rounded-xl border p-3"
              >
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>

              <select
                value={formaPagamento}
                onChange={(event) => setFormaPagamento(event.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option>PIX</option>
                <option>Dinheiro</option>
                <option>Cartão</option>
              </select>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl border py-2 sm:flex-1"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full rounded-xl bg-[#8A0EEA] py-2 text-white sm:flex-1"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
