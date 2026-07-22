"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { ClinicalRecord, NewClinicalRecordInput } from "@/types/domain";

export function NewClinicalRecordModal({
  petId,
  defaultProfessionalName,
  onSave,
  record,
}: {
  petId: number;
  defaultProfessionalName: string;
  onSave: (record: NewClinicalRecordInput) => Promise<void>;
  record?: ClinicalRecord;
}) {
  const [open, setOpen] = useState(false);
  const [consultationDate, setConsultationDate] = useState(
    record?.consultation_date || new Date().toLocaleDateString("en-CA"),
  );
  const [professionalName, setProfessionalName] = useState(
    record?.professional_name || defaultProfessionalName,
  );
  const [weightKg, setWeightKg] = useState(String(record?.weight_kg || ""));
  const [temperatureC, setTemperatureC] = useState(
    String(record?.temperature_c || ""),
  );
  const [mainComplaint, setMainComplaint] = useState(
    record?.main_complaint || "",
  );
  const [anamnesis, setAnamnesis] = useState(record?.anamnesis || "");
  const [allergies, setAllergies] = useState(record?.allergies || "");
  const [currentMedications, setCurrentMedications] = useState(
    record?.current_medications || "",
  );
  const [diagnosis, setDiagnosis] = useState(record?.diagnosis || "");
  const [conduct, setConduct] = useState(record?.conduct || "");
  const [returnDate, setReturnDate] = useState(record?.return_date || "");
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
        id: record?.id,
        petId,
        professionalName: professionalName.trim(),
        consultationDate,
        weightKg: parsedWeight,
        temperatureC: parsedTemperature,
        mainComplaint: mainComplaint.trim(),
        anamnesis: anamnesis.trim(),
        allergies: allergies.trim(),
        currentMedications: currentMedications.trim(),
        diagnosis: diagnosis.trim(),
        conduct: conduct.trim(),
        returnDate,
      });
      setOpen(false);
      if (!record) {
        setWeightKg("");
        setTemperatureC("");
        setMainComplaint("");
        setAnamnesis("");
        setAllergies("");
        setCurrentMedications("");
        setDiagnosis("");
        setConduct("");
        setReturnDate("");
      }
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
        className={
          record
            ? "rounded-lg border px-3 py-1.5 text-sm font-medium text-[#8A0EEA]"
            : "w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
        }
      >
        {record ? "Editar consulta" : "Nova consulta"}
      </button>

      {open && (
        <div className="erp-modal-overlay" role="dialog" aria-modal="true">
          <div className="erp-modal-panel max-w-3xl">
            <h2 className="text-xl font-bold">
              {record ? "Editar consulta clínica" : "Nova consulta clínica"}
            </h2>
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
                label="Anamnese"
                value={anamnesis}
                onChange={setAnamnesis}
              />
              <ClinicalTextarea
                label="Alergias"
                value={allergies}
                onChange={setAllergies}
              />
              <ClinicalTextarea
                label="Medicamentos em uso"
                value={currentMedications}
                onChange={setCurrentMedications}
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
                {saving
                  ? "Salvando..."
                  : record
                    ? "Salvar alterações"
                    : "Salvar consulta"}
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
