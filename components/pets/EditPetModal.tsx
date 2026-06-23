"use client";

import { useState } from "react";

import type { Pet, Tutor } from "@/types/domain";

interface EditPetModalProps {
  pet: Pet;
  tutors: Tutor[];
  onSave: (pet: Pet & { tutorId: string }) => void;
}

export function EditPetModal({ pet, tutors, onSave }: EditPetModalProps) {
  const [open, setOpen] = useState(true);
  const [nome, setNome] = useState(pet.nome || "");
  const [especie, setEspecie] = useState(pet.especie || "");
  const [raca, setRaca] = useState(pet.raca || "");
  const [tutorId, setTutorId] = useState(String(pet.tutor_id || ""));
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");

  function handleSave() {
    onSave({
      ...pet,
      nome,
      especie,
      raca,
      tutorId,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
      >
        Editar Pet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-bold sm:text-2xl">Editar</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="w-full rounded-lg border p-2 sm:col-span-2"
              />

              <select
                value={especie}
                onChange={(event) => setEspecie(event.target.value)}
                className="w-full rounded-lg border p-2"
              >
                <option value="">Espécie</option>
                <option value="Cachorro">Cachorro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Outro">Outro</option>
              </select>

              <input
                placeholder="Raça"
                value={raca}
                onChange={(event) => setRaca(event.target.value)}
                className="w-full rounded-lg border p-2"
              />

              <select
                value={sexo}
                onChange={(event) => setSexo(event.target.value)}
                className="w-full rounded-lg border p-2"
              >
                <option value="">Sexo</option>
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>

              <input
                placeholder="Peso (kg)"
                value={peso}
                onChange={(event) => setPeso(event.target.value)}
                className="w-full rounded-lg border p-2"
              />

              <select
                value={tutorId}
                onChange={(event) => setTutorId(event.target.value)}
                className="w-full rounded-lg border p-2 sm:col-span-2"
              >
                <option value="">Selecione o Tutor</option>

                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.nome}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
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
