"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewClinicalRecordInput } from "@/types/domain";

export function NewClinicalRecordModal({
  petId,
  defaultProfessionalName,
  onSave,
}: {
  petId: number;
  defaultProfessionalName: string;
  onSave: (record: NewClinicalRecordInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [consultationDate, setConsultationDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [professionalName, setProfessionalName] = useState(
    defaultProfessionalName,
  );
  const [weightKg, setWeightKg] = useState("");
  const [temperatureC, setTemperatureC] = useState("");
  const [mainComplaint, setMainComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [conduct, setConduct] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (
      !consultationDate ||
      !professionalName.trim() ||
      !mainComplaint.trim()
    ) {
      toast.error("Informe data, profissional e queixa principal");
      return;
    }

    const parsedWeight = weightKg ? Number(weightKg) : undefined;
    const parsedTemperature = temperatureC ? Number(temperatureC) : undefined;

    if (
      (parsedWeight !== undefined &&
        (!Number.isFinite(parsedWeight) || parsedWeight <= 0)) ||
      (parsedTemperature !== undefined &&
        (!Number.isFinite(parsedTemperature) ||
          parsedTemperature < 30 ||
          parsedTemperature > 45))
    ) {
      toast.error("Informe peso e temperatura válidos");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        petId,
        professionalName: professionalName.trim(),
        consultationDate,
        weightKg: parsedWeight,
        temperatureC: parsedTemperature,
        mainComplaint: mainComplaint.trim(),
        diagnosis: diagnosis.trim(),
        conduct: conduct.trim(),
        returnDate,
      });
      setOpen(false);
      setWeightKg("");
      setTemperatureC("");
      setMainComplaint("");
      setDiagnosis("");
      setConduct("");
      setReturnDate("");
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
        Nova consulta
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Nova consulta clínica</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ClinicalInput
                label="Data da consulta"
                type="date"
                value={consultationDate}
                onChange={setConsultationDate}
              />
              <ClinicalInput
                label="Profissional"
                value={professionalName}
                onChange={setProfessionalName}
              />
              <ClinicalInput
                label="Peso (kg)"
                type="number"
                value={weightKg}
                onChange={setWeightKg}
              />
              <ClinicalInput
                label="Temperatura (°C)"
                type="number"
                value={temperatureC}
                onChange={setTemperatureC}
              />
              <ClinicalTextarea
                label="Queixa principal"
                value={mainComplaint}
                onChange={setMainComplaint}
              />
              <ClinicalTextarea
                label="Diagnóstico"
                value={diagnosis}
                onChange={setDiagnosis}
              />
              <div className="sm:col-span-2">
                <ClinicalTextarea
                  label="Conduta e orientações"
                  value={conduct}
                  onChange={setConduct}
                />
              </div>
              <ClinicalInput
                label="Data de retorno"
                type="date"
                value={returnDate}
                onChange={setReturnDate}
              />
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
                className="rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-60 sm:flex-1"
              >
                {saving ? "Salvando..." : "Salvar consulta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ClinicalInput({
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
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.1" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}

function ClinicalTextarea({
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
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
