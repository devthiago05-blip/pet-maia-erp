"use client";

import { type ChangeEvent, useState } from "react";
import { toast } from "sonner";

import { uploadPetPhoto } from "@/services/pets";
import type { Pet, Tutor } from "@/types/domain";

interface EditPetModalProps {
  pet: Pet;
  tutors: Tutor[];
  onSave: (pet: Pet & { tutorId: string }) => void | Promise<void>;
  onClose: () => void;
}

export function EditPetModal({
  pet,
  tutors,
  onSave,
  onClose,
}: EditPetModalProps) {
  const [nome, setNome] = useState(pet.nome || "");
  const [especie, setEspecie] = useState(pet.especie || "");
  const [raca, setRaca] = useState(pet.raca || "");
  const [sexo, setSexo] = useState(pet.sexo || "");
  const [idade, setIdade] = useState(pet.idade || "");
  const [porte, setPorte] = useState(pet.porte || "Pequeno");
  const [tutorId, setTutorId] = useState(String(pet.tutor_id || ""));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(pet.photo_url || "");
  const [saving, setSaving] = useState(false);
  const [bathReminderIntervalDays, setBathReminderIntervalDays] = useState(
    pet.bath_reminder_interval_days
      ? String(pet.bath_reminder_interval_days)
      : "",
  );

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(pet.photo_url || "");
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
    if (!nome || !especie || !tutorId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSaving(true);

    let photoUrl = pet.photo_url || null;

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

    await onSave({
      ...pet,
      nome,
      especie,
      raca,
      sexo,
      idade,
      porte,
      photo_url: photoUrl,
      tutorId,
      bath_reminder_interval_days: bathReminderIntervalDays
        ? Number(bathReminderIntervalDays)
        : null,
    });

    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">Editar Pet</h2>

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
                className="h-44 w-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
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
  );
}
