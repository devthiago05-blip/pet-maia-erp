"use client";

import { AlertTriangle, History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ClinicalRecord, NewClinicalRecordInput } from "@/types/domain";

export function NewClinicalRecordModal({
  petId,
  defaultProfessionalName,
  onSave,
  record,
  previousRecord,
}: {
  petId: number;
  defaultProfessionalName: string;
  onSave: (record: NewClinicalRecordInput) => Promise<void>;
  record?: ClinicalRecord;
  previousRecord?: ClinicalRecord;
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
  const [heartRate, setHeartRate] = useState(String(record?.heart_rate || ""));
  const [respiratoryRate, setRespiratoryRate] = useState(
    String(record?.respiratory_rate || ""),
  );
  const [mucousMembranes, setMucousMembranes] = useState(
    record?.mucous_membranes || "",
  );
  const [hydrationStatus, setHydrationStatus] = useState(
    record?.hydration_status || "",
  );
  const [painScore, setPainScore] = useState(String(record?.pain_score ?? ""));
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

  function copyPreviousClinicalData() {
    if (!previousRecord) return;
    setAllergies(previousRecord.allergies || "");
    setCurrentMedications(previousRecord.current_medications || "");
    toast.success("Alergias e medicamentos copiados da última consulta.");
  }

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
    const parsedHeartRate = heartRate ? Number(heartRate) : undefined;
    const parsedRespiratoryRate = respiratoryRate
      ? Number(respiratoryRate)
      : undefined;
    const parsedPainScore = painScore !== "" ? Number(painScore) : undefined;

    if (
      (parsedWeight !== undefined &&
        (!Number.isFinite(parsedWeight) || parsedWeight <= 0)) ||
      (parsedTemperature !== undefined &&
        (!Number.isFinite(parsedTemperature) ||
          parsedTemperature < 30 ||
          parsedTemperature > 45)) ||
      (parsedHeartRate !== undefined &&
        (!Number.isInteger(parsedHeartRate) ||
          parsedHeartRate < 20 ||
          parsedHeartRate > 400)) ||
      (parsedRespiratoryRate !== undefined &&
        (!Number.isInteger(parsedRespiratoryRate) ||
          parsedRespiratoryRate < 5 ||
          parsedRespiratoryRate > 200)) ||
      (parsedPainScore !== undefined &&
        (!Number.isInteger(parsedPainScore) ||
          parsedPainScore < 0 ||
          parsedPainScore > 10))
    ) {
      toast.error("Confira os sinais vitais e a escala de dor.");
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
        heartRate: parsedHeartRate,
        respiratoryRate: parsedRespiratoryRate,
        mucousMembranes,
        hydrationStatus,
        painScore: parsedPainScore,
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
        setHeartRate("");
        setRespiratoryRate("");
        setMucousMembranes("");
        setHydrationStatus("");
        setPainScore("");
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
            {!record && previousRecord && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
                      <History size={17} /> Referência da última consulta
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-900">
                      <span className="rounded-lg bg-white/80 px-2 py-1">
                        Data:{" "}
                        {formatClinicalDate(previousRecord.consultation_date)}
                      </span>
                      {previousRecord.weight_kg && (
                        <span className="rounded-lg bg-white/80 px-2 py-1">
                          Peso: {previousRecord.weight_kg} kg
                        </span>
                      )}
                      {previousRecord.temperature_c && (
                        <span className="rounded-lg bg-white/80 px-2 py-1">
                          Temperatura: {previousRecord.temperature_c} °C
                        </span>
                      )}
                    </div>
                  </div>
                  {(previousRecord.allergies ||
                    previousRecord.current_medications) && (
                    <button
                      type="button"
                      onClick={copyPreviousClinicalData}
                      className="shrink-0 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      Copiar dados clínicos
                    </button>
                  )}
                </div>
                {(previousRecord.allergies ||
                  previousRecord.current_medications) && (
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {previousRecord.allergies && (
                      <div className="rounded-xl bg-white/80 p-3">
                        <strong className="flex items-center gap-1 text-amber-800">
                          <AlertTriangle size={15} /> Alergias registradas
                        </strong>
                        <p className="mt-1 whitespace-pre-line text-slate-700">
                          {previousRecord.allergies}
                        </p>
                      </div>
                    )}
                    {previousRecord.current_medications && (
                      <div className="rounded-xl bg-white/80 p-3">
                        <strong className="text-amber-800">
                          Medicamentos em uso
                        </strong>
                        <p className="mt-1 whitespace-pre-line text-slate-700">
                          {previousRecord.current_medications}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-3 text-xs text-amber-800">
                  Confirme com o tutor antes de manter essas informações no novo
                  atendimento.
                </p>
              </div>
            )}
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
              <ClinicalInput
                label="Frequência cardíaca (bpm)"
                type="number"
                min="20"
                max="400"
                step="1"
                value={heartRate}
                onChange={setHeartRate}
              />
              <ClinicalInput
                label="Frequência respiratória (mpm)"
                type="number"
                min="5"
                max="200"
                step="1"
                value={respiratoryRate}
                onChange={setRespiratoryRate}
              />
              <ClinicalSelect
                label="Mucosas"
                value={mucousMembranes}
                onChange={setMucousMembranes}
                options={[
                  "",
                  "Normocoradas",
                  "Pálidas",
                  "Congestas",
                  "Cianóticas",
                  "Ictéricas",
                ]}
              />
              <ClinicalSelect
                label="Hidratação"
                value={hydrationStatus}
                onChange={setHydrationStatus}
                options={[
                  "",
                  "Normal",
                  "Desidratação leve",
                  "Desidratação moderada",
                  "Desidratação grave",
                ]}
              />
              <ClinicalInput
                label="Escala de dor (0 a 10)"
                type="number"
                min="0"
                max="10"
                step="1"
                value={painScore}
                onChange={setPainScore}
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

function formatClinicalDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function ClinicalInput({
  label,
  value,
  type = "text",
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        min={min ?? (type === "number" ? "0" : undefined)}
        max={max}
        step={step ?? (type === "number" ? "0.1" : undefined)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}

function ClinicalSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "Não informado"}
          </option>
        ))}
      </select>
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
