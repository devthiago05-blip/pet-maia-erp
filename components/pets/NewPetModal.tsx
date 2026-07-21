"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { uploadPetPhoto } from "@/services/pets";
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
  const [bathReminderIntervalDays, setBathReminderIntervalDays] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    setBathReminderIntervalDays("");
    setPhotoFile(null);
    setPhotoPreview("");
    setSaving(false);
    setSubmitted(false);
  }

  function handleClose() {
    resetForm();
    setModalOpen(false);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem valida");
      event.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSubmitted(true);

    const tutorSelecionado = tutors.find(
      (tutor) => String(tutor.id) === tutorId,
    );

    const camposPendentes = [
      !nome.trim() ? "nome" : "",
      !especie ? "espécie" : "",
      !tutorSelecionado ? "tutor" : "",
    ].filter(Boolean);

    if (camposPendentes.length > 0) {
      toast.error(`Preencha: ${camposPendentes.join(", ")}`);
      return;
    }

    setSaving(true);

    let photoUrl: string | null = null;

    if (photoFile) {
      const uploadResponse = await uploadPetPhoto(photoFile);

      if (uploadResponse.error) {
        console.error(uploadResponse.error);
        toast.error(uploadResponse.error.message || "Erro ao enviar foto");
        setSaving(false);
        return;
      }

      photoUrl = uploadResponse.data || null;
    }

    const result = await onSave({
      nome: nome.trim(),
      especie,
      raca: raca.trim(),
      tutorId,
      sexo,
      idade: idade.trim(),
      porte,
      photoUrl,
      bathReminderIntervalDays,
    });

    setSaving(false);

    if (result === false) {
      return;
    }

    handleClose();
  }

  function getRequiredFieldClass(hasError: boolean) {
    return hasError
      ? "w-full rounded-lg border border-red-400 bg-red-50 p-2 outline-none ring-2 ring-red-100"
      : "w-full rounded-lg border p-2";
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
            <p className="mb-4 text-sm text-slate-500">
              Campos com * são obrigatórios.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Nome *"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
                aria-invalid={submitted && !nome.trim()}
                className={`${getRequiredFieldClass(
                  submitted && !nome.trim(),
                )} sm:col-span-2`}
              />

              <select
                value={especie}
                onChange={(event) => setEspecie(event.target.value)}
                required
                aria-invalid={submitted && !especie}
                className={getRequiredFieldClass(submitted && !especie)}
              >
                <option value="">Espécie *</option>
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
                required
                aria-invalid={submitted && !tutorId}
                className={getRequiredFieldClass(submitted && !tutorId)}
              >
                <option value="">Selecione o Tutor *</option>

                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.nome}
                  </option>
                ))}
              </select>

              <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
                Recorrência de banho
                <select
                  value={bathReminderIntervalDays}
                  onChange={(event) =>
                    setBathReminderIntervalDays(event.target.value)
                  }
                  className="w-full rounded-lg border p-2 font-normal"
                >
                  <option value="">Sem recorrência automática</option>
                  <option value="7">A cada 7 dias</option>
                  <option value="15">A cada 15 dias</option>
                  <option value="30">A cada 30 dias</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Foto do pet
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoChange}
                  className="w-full rounded-lg border bg-white p-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:font-semibold file:text-[#8A0EEA]"
                />
              </label>

              {photoPreview && (
                <div className="overflow-hidden rounded-xl border bg-slate-50 sm:col-span-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Previa do pet"
                    className="h-44 w-full bg-slate-50 object-contain p-1"
                  />
                </div>
              )}

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
                  disabled={saving}
                  className="w-full rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-60 sm:flex-1"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
