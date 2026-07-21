"use client";

import { Activity, BedDouble, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type {
  ClinicalHospitalization,
  ClinicPatientOverview,
} from "@/types/domain";

type LogType = "Evolução" | "Sinais vitais" | "Medicação" | "Alimentação";

export function HospitalizationPanel({
  hospitalizations,
  patients,
  professionalName,
  onAdmit,
  onLog,
  onDischarge,
}: {
  hospitalizations: ClinicalHospitalization[];
  patients: ClinicPatientOverview[];
  professionalName: string;
  onAdmit: (input: {
    petId: number;
    reason: string;
    veterinarianName?: string;
    kennel?: string;
  }) => Promise<boolean>;
  onLog: (input: {
    hospitalizationId: number;
    logType: LogType;
    notes: string;
    temperatureC?: number;
    weightKg?: number;
    heartRate?: number;
    respiratoryRate?: number;
    professionalName?: string;
  }) => Promise<boolean>;
  onDischarge: (id: number) => Promise<boolean>;
}) {
  const [showAdmission, setShowAdmission] = useState(false);
  const [petId, setPetId] = useState("");
  const [reason, setReason] = useState("");
  const [kennel, setKennel] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [logType, setLogType] = useState<LogType>("Evolução");
  const [notes, setNotes] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [saving, setSaving] = useState(false);
  const active = hospitalizations.filter((item) => item.status === "Internado");

  async function admit(event: React.FormEvent) {
    event.preventDefault();
    if (!petId || !reason.trim()) return;
    setSaving(true);
    const ok = await onAdmit({
      petId: Number(petId),
      reason,
      veterinarianName: professionalName,
      kennel,
    });
    setSaving(false);
    if (ok) {
      setReason("");
      setKennel("");
      setPetId("");
      setShowAdmission(false);
    }
  }

  async function saveLog(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !notes.trim()) return;
    setSaving(true);
    const ok = await onLog({
      hospitalizationId: selectedId,
      logType,
      notes,
      temperatureC: Number(temperature) || undefined,
      weightKg: Number(weight) || undefined,
      heartRate: Number(heartRate) || undefined,
      respiratoryRate: Number(respiratoryRate) || undefined,
      professionalName,
    });
    setSaving(false);
    if (ok) {
      setNotes("");
      setTemperature("");
      setWeight("");
      setHeartRate("");
      setRespiratoryRate("");
      setSelectedId(null);
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-50 p-3 text-sky-700">
            <BedDouble size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Internação</h2>
            <p className="text-sm text-slate-500">
              {active.length} paciente(s) internado(s)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdmission((value) => !value)}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white"
        >
          <Plus size={18} />
          Admitir paciente
        </button>
      </div>

      {showAdmission && (
        <form
          onSubmit={admit}
          className="mt-4 grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-medium">
            Pet
            <select
              required
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="rounded-xl border bg-white p-3 font-normal"
            >
              <option value="">Selecione</option>
              {patients.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.nome} · {pet.tutors?.nome || "Sem tutor"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Canil/leito
            <input
              value={kennel}
              onChange={(e) => setKennel(e.target.value)}
              placeholder="Ex.: Leito 2"
              className="rounded-xl border bg-white p-3 font-normal"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Motivo
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="rounded-xl border bg-white p-3 font-normal"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 p-3 font-medium text-white disabled:opacity-50 md:col-span-2"
          >
            {saving ? "Admitindo..." : "Confirmar internação"}
          </button>
        </form>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {active.map((item) => {
          const logs = [...(item.clinical_hospitalization_logs || [])].sort(
            (a, b) => b.recorded_at.localeCompare(a.recorded_at),
          );
          return (
            <article
              key={item.id}
              className="rounded-xl border border-sky-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{item.pets?.nome || "Paciente"}</h3>
                  <p className="text-sm text-slate-500">
                    {item.pets?.tutors?.nome || "Tutor não informado"} ·{" "}
                    {item.kennel || "Sem leito"}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
                  Internado
                </span>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                <p>
                  <strong>Entrada:</strong>{" "}
                  {new Date(item.admission_at).toLocaleString("pt-BR")}
                </p>
                <p className="mt-1">
                  <strong>Motivo:</strong> {item.reason}
                </p>
              </div>
              {selectedId === item.id && (
                <form
                  onSubmit={saveLog}
                  className="mt-3 grid gap-2 rounded-xl border p-3 sm:grid-cols-2"
                >
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as LogType)}
                    className="rounded-lg border p-2 sm:col-span-2"
                  >
                    <option>Evolução</option>
                    <option>Sinais vitais</option>
                    <option>Medicação</option>
                    <option>Alimentação</option>
                  </select>
                  {logType === "Sinais vitais" && (
                    <>
                      <input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="Temperatura °C"
                        className="rounded-lg border p-2"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Peso kg"
                        className="rounded-lg border p-2"
                      />
                      <input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        placeholder="Freq. cardíaca"
                        className="rounded-lg border p-2"
                      />
                      <input
                        type="number"
                        value={respiratoryRate}
                        onChange={(e) => setRespiratoryRate(e.target.value)}
                        placeholder="Freq. respiratória"
                        className="rounded-lg border p-2"
                      />
                    </>
                  )}
                  <textarea
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Registro clínico"
                    className="rounded-lg border p-2 sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="rounded-lg border p-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-sky-600 p-2 text-white disabled:opacity-50"
                  >
                    Salvar registro
                  </button>
                </form>
              )}
              {logs[0] && (
                <div className="mt-3 border-l-2 border-sky-300 pl-3 text-sm">
                  <p className="font-medium">
                    Último registro: {logs[0].log_type}
                  </p>
                  <p className="text-slate-600">{logs[0].notes}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(logs[0].recorded_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-sky-500 p-2 text-sm text-sky-700"
                >
                  <Activity size={16} />
                  Registrar
                </button>
                <Link
                  href={`/pets/${item.pet_id}`}
                  className="rounded-xl border border-[#8A0EEA] p-2 text-center text-sm text-[#8A0EEA]"
                >
                  Prontuário
                </Link>
                <button
                  type="button"
                  onClick={() => onDischarge(item.id)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-emerald-500 p-2 text-sm text-emerald-700"
                >
                  <CheckCircle2 size={16} />
                  Alta
                </button>
              </div>
            </article>
          );
        })}
        {active.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500 xl:col-span-2">
            Nenhum paciente internado.
          </div>
        )}
      </div>
    </section>
  );
}
