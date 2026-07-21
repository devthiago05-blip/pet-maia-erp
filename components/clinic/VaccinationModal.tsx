"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewPetVaccinationInput } from "@/types/domain";

export function VaccinationModal({
  petId,
  species,
  defaultProfessionalName,
  onSave,
}: {
  petId: number;
  species?: string;
  defaultProfessionalName: string;
  onSave: (vaccination: NewPetVaccinationInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [vaccineName, setVaccineName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [applicationDate, setApplicationDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [nextDoseDate, setNextDoseDate] = useState("");
  const [professionalName, setProfessionalName] = useState(
    defaultProfessionalName,
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const suggestions = getVaccineSuggestions(species);

  function setNextDoseInDays(days: number) {
    const date = new Date(`${applicationDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    setNextDoseDate(date.toLocaleDateString("en-CA"));
  }

  async function handleSave() {
    if (!vaccineName.trim() || !applicationDate || !professionalName.trim()) {
      toast.error("Informe vacina, data e profissional");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        petId,
        vaccineName: vaccineName.trim(),
        manufacturer: manufacturer.trim(),
        batchNumber: batchNumber.trim(),
        applicationDate,
        nextDoseDate,
        professionalName: professionalName.trim(),
        notes: notes.trim(),
      });
      setOpen(false);
      setVaccineName("");
      setManufacturer("");
      setBatchNumber("");
      setNextDoseDate("");
      setNotes("");
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
      >
        Registrar vacina
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Registrar vacina</h2>
            <div className="mt-4 rounded-xl bg-purple-50 p-3">
              <p className="text-xs font-semibold uppercase text-[#8A0EEA]">
                Sugestões para {species || "o paciente"}
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setVaccineName(suggestion)}
                    className="whitespace-nowrap rounded-full border border-purple-200 bg-white px-3 py-1.5 text-sm text-[#8A0EEA]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Apoio baseado nas diretrizes WSAVA. Valide o protocolo conforme
                idade, risco, região e fabricante.
              </p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <VaccineInput
                label="Vacina"
                value={vaccineName}
                onChange={setVaccineName}
              />
              <VaccineInput
                label="Fabricante"
                value={manufacturer}
                onChange={setManufacturer}
              />
              <VaccineInput
                label="Lote"
                value={batchNumber}
                onChange={setBatchNumber}
              />
              <VaccineInput
                label="Profissional"
                value={professionalName}
                onChange={setProfessionalName}
              />
              <VaccineInput
                label="Data de aplicação"
                type="date"
                value={applicationDate}
                onChange={setApplicationDate}
              />
              <VaccineInput
                label="Próxima dose"
                type="date"
                value={nextDoseDate}
                onChange={setNextDoseDate}
              />
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <span className="w-full text-xs font-medium text-slate-500">
                  Calcular próxima dose
                </span>
                <DoseButton
                  label="Em 21 dias"
                  onClick={() => setNextDoseInDays(21)}
                />
                <DoseButton
                  label="Em 30 dias"
                  onClick={() => setNextDoseInDays(30)}
                />
                <DoseButton
                  label="Em 1 ano"
                  onClick={() => setNextDoseInDays(365)}
                />
              </div>
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Observações
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="resize-y rounded-xl border p-3 font-normal"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border py-2 sm:flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-50 sm:flex-1"
              >
                {saving ? "Salvando..." : "Salvar vacina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getVaccineSuggestions(species?: string) {
  const normalized = species?.toLocaleLowerCase("pt-BR") || "";
  if (normalized.includes("gat") || normalized.includes("felin")) {
    return ["V3 / V4 / V5 felina", "Antirrábica", "FeLV"];
  }
  return [
    "V8 / V10 polivalente",
    "Antirrábica",
    "Leptospirose",
    "Tosse dos canis",
  ];
}

function DoseButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-3 py-2 text-xs font-medium text-slate-600 hover:border-purple-300 hover:bg-purple-50"
    >
      {label}
    </button>
  );
}

function VaccineInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
