"use client";

import { useState } from "react";


interface FinishAppointmentModalProps {
  pet: string;

  onSave: (dados: {
    valor: number;
    formaPagamento: string;
  }) => void;
}

export function FinishAppointmentModal({
  pet,
  onSave,
}: FinishAppointmentModalProps) {
  const [open, setOpen] = useState(false);

  const [valor, setValor] =
    useState("");

  const [
    formaPagamento,
    setFormaPagamento,
  ] = useState("PIX");

  function handleSave() {
    if (!valor.trim()) {
      alert(
        "Preencha todos os campos"
      );
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
        onClick={() =>
          setOpen(true)
        }
        className="bg-[#8A0EEA] text-white px-4 py-2 rounded-xl"
      >
        Finalizar Atendimento
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">
  Finalizar Atendimento
</h2>

            <div className="space-y-4">

        
                <div className="bg-slate-100 p-3 rounded-xl">
  <strong>Pet:</strong> {pet}
</div>
              <input
                type="number"
                placeholder="Valor"
                value={valor}
                onChange={(e) =>
                  setValor(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3"
              />
        
              <select
                value={formaPagamento}
                onChange={(e) =>
                  setFormaPagamento(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3"
              >
                <option>
                  PIX
                </option>

                <option>
                  Dinheiro
                </option>

                <option>
                  Cartão
                </option>
              </select>

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    setOpen(false)
                  }
                  className="flex-1 border rounded-xl py-2"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#8A0EEA] text-white rounded-xl py-2"
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