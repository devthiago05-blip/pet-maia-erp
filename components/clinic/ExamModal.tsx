"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { ClinicalExam, ClinicalExamInput } from "@/types/domain";

export function ExamModal({
  petId,
  exam,
  defaultProfessionalName,
  onSave,
}: {
  petId: number;
  exam?: ClinicalExam;
  defaultProfessionalName: string;
  onSave: (input: ClinicalExamInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [examName, setExamName] = useState(exam?.exam_name || "");
  const [requestDate, setRequestDate] = useState(
    exam?.request_date || new Date().toLocaleDateString("en-CA"),
  );
  const [collectionDate, setCollectionDate] = useState(
    exam?.collection_date || "",
  );
  const [resultDate, setResultDate] = useState(exam?.result_date || "");
  const [laboratory, setLaboratory] = useState(exam?.laboratory || "");
  const [status, setStatus] = useState(exam?.status || "Solicitado");
  const [result, setResult] = useState(exam?.result || "");
  const [notes, setNotes] = useState(exam?.notes || "");
  const [professionalName, setProfessionalName] = useState(
    exam?.professional_name || defaultProfessionalName,
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!examName.trim() || !requestDate || !professionalName.trim()) {
      toast.error("Informe exame, data da solicitação e profissional");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: exam?.id,
        petId,
        examName: examName.trim(),
        requestDate,
        collectionDate,
        resultDate,
        laboratory: laboratory.trim(),
        status,
        result: result.trim(),
        notes: notes.trim(),
        professionalName: professionalName.trim(),
      });
      setOpen(false);
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
          exam
            ? "text-blue-600"
            : "w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
        }
      >
        {exam ? "Atualizar" : "Solicitar exame"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">
              {exam ? "Atualizar exame" : "Solicitar exame"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ExamInput
                label="Exame"
                value={examName}
                onChange={setExamName}
              />
              <ExamInput
                label="Profissional"
                value={professionalName}
                onChange={setProfessionalName}
              />
              <ExamInput
                label="Solicitação"
                type="date"
                value={requestDate}
                onChange={setRequestDate}
              />
              <ExamInput
                label="Coleta"
                type="date"
                value={collectionDate}
                onChange={setCollectionDate}
              />
              <ExamInput
                label="Resultado em"
                type="date"
                value={resultDate}
                onChange={setResultDate}
              />
              <ExamInput
                label="Laboratório"
                value={laboratory}
                onChange={setLaboratory}
              />
              <label className="grid gap-2 text-sm font-medium">
                Status
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ClinicalExam["status"])
                  }
                  className="rounded-xl border p-3 font-normal"
                >
                  <option>Solicitado</option>
                  <option>Coletado</option>
                  <option>Concluído</option>
                  <option>Cancelado</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Resultado
                <textarea
                  rows={4}
                  value={result}
                  onChange={(event) => setResult(event.target.value)}
                  className="resize-y rounded-xl border p-3 font-normal"
                />
              </label>
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
                {saving ? "Salvando..." : "Salvar exame"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ExamInput({
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
