"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { NewPetInput, Tutor } from "@/types/domain";

interface NewPetModalProps {
  tutors: Tutor[];
  onSave: (pet: NewPetInput) => Promise<boolean | void> | boolean | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTutorId?: string;
  hideTrigger?: boolean;
}

export function NewPetModal({
  tutors,
  onSave,
  open,
  onOpenChange,
  defaultTutorId = "",
  hideTrigger = false,
}: NewPetModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [sexo, setSexo] = useState("");
  const [idade, setIdade] = useState("");
  const [porte, setPorte] = useState("Pequeno");
  const [tutorId, setTutorId] = useState(defaultTutorId);

  const modalOpen = open ?? internalOpen;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (modalOpen && defaultTutorId) {
        setTutorId(defaultTutorId);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [defaultTutorId, modalOpen]);

  function setModalOpen(value: boolean) {
    if (open === undefined) {
      setInternalOpen(value);
    }

    onOpenChange?.(value);
  }

  function resetForm() {
    setNome("");
    setEspecie("");
    setRaca("");
    setSexo("");
    setIdade("");
    setPorte("Pequeno");
    setTutorId(defaultTutorId || "");
  }

  function handleClose() {
    resetForm();
    setModalOpen(false);
  }

  async function handleSave() {
    const tutorSelecionado = tutors.find(
      (tutor) => String(tutor.id) === tutorId,
    );

    if (!nome.trim() || !especie || !tutorSelecionado) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const result = await onSave({
      nome: nome.trim(),
      especie,
      raca: raca.trim(),
      tutorId,
      sexo,
      idade: idade.trim(),
      porte,
    });

    if (result === false) {
      return;
    }

    handleClose();
  }

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
        >
          Novo Pet
        </button>
      )}

      {modalOpen && (
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
                  onClick={handleClose}
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
