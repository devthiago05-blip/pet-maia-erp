"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FinishAppointmentModalProps {
  pet: string;
  onSave: (dados: { valor: number; formaPagamento: string }) => void;
}

export function FinishAppointmentModal({
  pet,
  onSave,
}: FinishAppointmentModalProps) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");

  function handleSave() {
    if (!valor.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    onSave({
      valor: Number(valor),
      formaPagamento,
    });

    setValor("");
    setFormaPagamento("PIX");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
      >
        Finalizar Atendimento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-bold">Finalizar Atendimento</h2>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-100 p-3">
                <strong>Pet:</strong> {pet}
              </div>

              <input
                type="number"
                placeholder="Valor"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

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
