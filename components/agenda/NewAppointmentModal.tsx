"use client";

import { useState } from "react";

interface NewAppointmentModalProps {
  onSave: (appointment: {
    id: number;
    pet: string;
    servico: string;
    data: string;
    hora: string;
    status: string;
  }) => void;
}

export function NewAppointmentModal({
  onSave,
}: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false);

  const [pet, setPet] = useState("");
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [status, setStatus] =
    useState("Agendado");

  function handleSave() {
    if (
      !pet ||
      !servico ||
      !data ||
      !hora
    ) {
      alert(
        "Preencha todos os campos obrigatórios"
      );
      return;
    }

    onSave({
      id: Date.now(),
      pet,
      servico,
      data,
      hora,
      status,
    });

    setOpen(false);

    setPet("");
    setServico("");
    setData("");
    setHora("");
    setStatus("Agendado");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#8A0EEA] text-white px-4 py-2 rounded-xl"
      >
        Novo Agendamento
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl p-6 w-full max-w-xl">

            <h2 className="text-2xl font-bold mb-6">
              Novo Agendamento
            </h2>

            <div className="grid gap-4">

              <input
                placeholder="Pet"
                value={pet}
                onChange={(e) =>
                  setPet(e.target.value)
                }
                className="border rounded-xl p-3"
              />

              <input
                placeholder="Serviço"
                value={servico}
                onChange={(e) =>
                  setServico(e.target.value)
                }
                className="border rounded-xl p-3"
              />

              <input
                type="date"
                value={data}
                onChange={(e) =>
                  setData(e.target.value)
                }
                className="border rounded-xl p-3"
              />

              <input
                type="time"
                value={hora}
                onChange={(e) =>
                  setHora(e.target.value)
                }
                className="border rounded-xl p-3"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="border rounded-xl p-3"
              >
                <option>
                  Agendado
                </option>

                <option>
                  Concluído
                </option>

                <option>
                  Cancelado
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