"use client";

import { useState } from "react";

interface Tutor {
  id: number;
  nome: string;
}

interface NewPetModalProps {
  tutors: Tutor[];

  onSave: (pet: {
    id: number;
    nome: string;
    especie: string;
    raca: string;
    tutor: string;
  }) => void;
}

export function NewPetModal({
  tutors,
  onSave,
}: NewPetModalProps) {
  const [open, setOpen] = useState(false);

  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [tutorId, setTutorId] = useState("");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#8A0EEA] text-white px-4 py-2 rounded-xl"
      >
        Novo Pet
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-full max-w-xl">

            <h2 className="text-2xl font-bold mb-4">
              Novo Pet
            </h2>

            <div className="grid gap-4">

              <input
                placeholder="Nome"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                className="border p-2 rounded-lg"
              />

              <select
                value={especie}
                onChange={(e) =>
                  setEspecie(e.target.value)
                }
                className="border p-2 rounded-lg"
              >
                <option value="">
                  Espécie
                </option>

                <option value="Cachorro">
                  Cachorro
                </option>

                <option value="Gato">
                  Gato
                </option>

                <option value="Ave">
                  Ave
                </option>

                <option value="Outro">
                  Outro
                </option>
              </select>

              <input
                placeholder="Raça"
                value={raca}
                onChange={(e) =>
                  setRaca(e.target.value)
                }
                className="border p-2 rounded-lg"
              />

              <select
                value={sexo}
                onChange={(e) =>
                  setSexo(e.target.value)
                }
                className="border p-2 rounded-lg"
              >
                <option value="">
                  Sexo
                </option>

                <option value="Macho">
                  Macho
                </option>

                <option value="Fêmea">
                  Fêmea
                </option>
              </select>

              <input
                placeholder="Peso (kg)"
                value={peso}
                onChange={(e) =>
                  setPeso(e.target.value)
                }
                className="border p-2 rounded-lg"
              />

              <select
                value={tutorId}
                onChange={(e) =>
                  setTutorId(e.target.value)
                }
                className="border p-2 rounded-lg"
              >
                <option value="">
                  Selecione o Tutor
                </option>

                {tutors.map((tutor) => (
                  <option
                    key={tutor.id}
                    value={tutor.id}
                  >
                    {tutor.nome}
                  </option>
                ))}
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
  onClick={() => {

    const tutorSelecionado =
      tutors.find(
        (t) =>
          t.id === Number(tutorId)
      );

    if (
      !nome ||
      !especie ||
      !tutorSelecionado
    ) {
      alert(
        "Preencha os campos obrigatórios"
      );
      return;
    }

    onSave({
      id: Date.now(),
      nome,
      especie,
      raca,
      tutor:
        tutorSelecionado.nome,
    });

    setOpen(false);

    setNome("");
    setEspecie("");
    setRaca("");
    setSexo("");
    setPeso("");
    setTutorId("");
  }}
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