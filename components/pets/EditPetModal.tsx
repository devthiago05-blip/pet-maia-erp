"use client";

import { useState } from "react";

interface Tutor {
  id: number;
  nome: string;
}

interface EditPetModalProps {
  pet: any;
  tutors: Tutor[];
  onSave: (pet: any) => void;
}

export function EditPetModal({
  pet,
  tutors,
  onSave,
}: EditPetModalProps) {
  const [open, setOpen] = useState(true);

  const [nome, setNome] =
  useState(pet.nome || "");

const [especie, setEspecie] =
  useState(pet.especie || "");

const [raca, setRaca] =
  useState(pet.raca || "");

const [tutorId, setTutorId] =
  useState(
    String(pet.tutor_id || "")
  );
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#8A0EEA] text-white px-4 py-2 rounded-xl"
      >
        Editar Pet
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-full max-w-xl">

            <h2 className="text-2xl font-bold mb-4">
              Editar
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

  onSave({
    ...pet,
    nome,
    especie,
    raca,
    tutorId,
  });

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