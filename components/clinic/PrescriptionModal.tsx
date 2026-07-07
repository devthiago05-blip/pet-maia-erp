"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewClinicalPrescriptionInput } from "@/types/domain";

const medicationOptions = [
  "Amoxicilina",
  "Amoxicilina + clavulanato",
  "Cefalexina",
  "Doxiciclina",
  "Enrofloxacino",
  "Meloxicam",
  "Prednisolona",
  "Dipirona",
  "Omeprazol",
  "Ondansetrona",
  "Metronidazol",
  "Outro medicamento",
];

export function PrescriptionModal({
  clinicalRecordId,
  onSave,
}: {
  clinicalRecordId: number;
  onSave: (prescription: NewClinicalPrescriptionInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [medication, setMedication] = useState("");
  const [customMedication, setCustomMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const selectedMedication =
      medication === "Outro medicamento" ? customMedication : medication;

    if (!selectedMedication.trim() || !dosage.trim() || !frequency.trim()) {
      toast.error("Informe medicamento, dose e frequência");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        clinicalRecordId,
        medication: selectedMedication.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        duration: duration.trim(),
        instructions: instructions.trim(),
      });
      setOpen(false);
      setMedication("");
      setCustomMedication("");
      setDosage("");
      setFrequency("");
      setDuration("");
      setInstructions("");
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
        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-[#8A0EEA]"
      >
        Adicionar prescrição
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Nova prescrição</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Medicamento
                <select
                  value={medication}
                  onChange={(event) => setMedication(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                >
                  <option value="">Selecione</option>
                  {medicationOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              {medication === "Outro medicamento" && (
                <PrescriptionInput
                  label="Nome do medicamento"
                  value={customMedication}
                  onChange={setCustomMedication}
                />
              )}
              <PrescriptionInput
                label="Dose"
                value={dosage}
                onChange={setDosage}
              />
              <PrescriptionInput
                label="Frequência"
                value={frequency}
                onChange={setFrequency}
              />
              <PrescriptionInput
                label="Duração"
                value={duration}
                onChange={setDuration}
              />
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Orientações
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
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
                {saving ? "Salvando..." : "Salvar prescrição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PrescriptionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
