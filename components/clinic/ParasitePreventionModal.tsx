"use client";

import { useState } from "react";
import { toast } from "sonner";

import type {
  NewPetParasitePreventionInput,
  PetParasitePrevention,
} from "@/types/domain";

const preventionTypes: PetParasitePrevention["prevention_type"][] = [
  "Vermífugo",
  "Antipulgas",
  "Carrapatos",
  "Antipulgas e carrapatos",
  "Outro",
];

export function ParasitePreventionModal({
  petId,
  defaultProfessionalName,
  onSave,
}: {
  petId: number;
  defaultProfessionalName: string;
  onSave: (input: NewPetParasitePreventionInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [preventionType, setPreventionType] =
    useState<PetParasitePrevention["prevention_type"]>("Vermífugo");
  const [productName, setProductName] = useState("");
  const [applicationDate, setApplicationDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [nextApplicationDate, setNextApplicationDate] = useState("");
  const [dose, setDose] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [professionalName, setProfessionalName] = useState(
    defaultProfessionalName,
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function setNextInDays(days: number) {
    const date = new Date(`${applicationDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    setNextApplicationDate(date.toLocaleDateString("en-CA"));
  }

  async function handleSave() {
    if (!productName.trim() || !applicationDate || !professionalName.trim()) {
      toast.error("Informe produto, data e profissional.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        petId,
        preventionType,
        productName: productName.trim(),
        applicationDate,
        nextApplicationDate,
        dose: dose.trim(),
        weightKg: weightKg ? Number(weightKg) : undefined,
        batchNumber: batchNumber.trim(),
        professionalName: professionalName.trim(),
        notes: notes.trim(),
      });
      setOpen(false);
      setProductName("");
      setNextApplicationDate("");
      setDose("");
      setBatchNumber("");
      setNotes("");
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
        Registrar preventivo
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Registrar antiparasitário</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Tipo
                <select
                  value={preventionType}
                  onChange={(event) =>
                    setPreventionType(
                      event.target
                        .value as PetParasitePrevention["prevention_type"],
                    )
                  }
                  className="rounded-xl border p-3 font-normal"
                >
                  {preventionTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <Field
                label="Produto"
                value={productName}
                onChange={setProductName}
              />
              <Field
                label="Aplicação"
                type="date"
                value={applicationDate}
                onChange={setApplicationDate}
              />
              <Field
                label="Próxima aplicação"
                type="date"
                value={nextApplicationDate}
                onChange={setNextApplicationDate}
              />
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <span className="w-full text-xs font-medium text-slate-500">
                  Calcular próxima aplicação
                </span>
                {[
                  [30, "30 dias"],
                  [90, "3 meses"],
                  [180, "6 meses"],
                  [365, "1 ano"],
                ].map(([days, label]) => (
                  <button
                    key={String(days)}
                    type="button"
                    onClick={() => setNextInDays(Number(days))}
                    className="rounded-lg border px-3 py-2 text-xs font-medium text-slate-600"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Field label="Dose" value={dose} onChange={setDose} />
              <Field
                label="Peso na aplicação (kg)"
                type="number"
                value={weightKg}
                onChange={setWeightKg}
              />
              <Field
                label="Lote"
                value={batchNumber}
                onChange={setBatchNumber}
              />
              <Field
                label="Profissional"
                value={professionalName}
                onChange={setProfessionalName}
              />
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Observações
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              A periodicidade depende do produto, peso e avaliação veterinária.
              Confira a bula antes de salvar.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar preventivo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
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
        step={type === "number" ? "0.001" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
