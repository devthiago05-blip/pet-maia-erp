"use client";

import { useState } from "react";

interface FinancialEntry {
  id: number;
  descricao: string;
  valor: number;
  formaPagamento: string;
  tipo: "Receita" | "Despesa";
}

interface NewFinancialModalProps {
  onSave: (entry: FinancialEntry) => void;
}

export function NewFinancialModal({
  onSave,
}: NewFinancialModalProps) {
  const [open, setOpen] = useState(false);

  const [descricao, setDescricao] =
    useState("");

  const [valor, setValor] =
    useState("");

    const [tipo, setTipo] =
  useState<"Receita" | "Despesa">(
    "Receita"
  );

  const [
    formaPagamento,
    setFormaPagamento,
  ] = useState("PIX");

  function handleSave() {
    if (
      !descricao.trim() ||
      !valor.trim()
    ) {
      alert(
        "Preencha todos os campos"
      );
      return;
    }

    onSave({
      id: Date.now(),
      descricao,
      valor: Number(valor),
      formaPagamento,
      tipo,
    });

    setDescricao("");
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
        Novo Lançamento
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">
              Novo Lançamento
            </h2>

            <div className="space-y-4">

              <input
                placeholder="Descrição"
                value={descricao}
                onChange={(e) =>
                  setDescricao(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3"
              />

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
  value={tipo}
  onChange={(e) =>
    setTipo(
      e.target.value as
        | "Receita"
        | "Despesa"
    )
  }
  className="w-full border rounded-xl p-3"
>
  <option value="Receita">
    Receita
  </option>

  <option value="Despesa">
    Despesa
  </option>
</select>
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