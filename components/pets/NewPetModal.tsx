"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewPetInput, Tutor } from "@/types/domain";

interface NewPetModalProps {
  tutors: Tutor[];
  onSave: (pet: NewPetInput & { id: number }) => void;
}

export function NewPetModal({ tutors, onSave }: NewPetModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [sexo, setSexo] = useState("");
  const [idade, setIdade] = useState("");
  const [porte, setPorte] = useState("Pequeno");
  const [tutorId, setTutorId] = useState("");

  function handleSave() {
    const tutorSelecionado = tutors.find(
      (tutor) => tutor.id === Number(tutorId),
    );

    if (!nome || !especie || !tutorSelecionado) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    onSave({
      id: Date.now(),
      nome,
      especie,
      raca,
      tutorId,
      sexo,
      idade,
      porte,
    });

    setOpen(false);
    setNome("");
    setEspecie("");
    setRaca("");
    setSexo("");
    setIdade("");
    setTutorId("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
      >
        Novo Pet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-bold sm:text-2xl">Novo Pet</h2>

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
                placeholder="Idade"
                value={idade}
                onChange={(event) => setIdade(event.target.value)}
                className="w-full rounded-lg border p-2"
              />

              <select
                value={porte}
                onChange={(event) => setPorte(event.target.value)}
                className="w-full rounded-lg border p-2"
              >
                <option value="Pequeno">Porte Pequeno</option>
                <option value="Médio">Porte Médio</option>
                <option value="Grande">Porte Grande</option>
              </select>

              <select
                value={tutorId}
                onChange={(event) => setTutorId(event.target.value)}
                className="w-full rounded-lg border p-2"
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
